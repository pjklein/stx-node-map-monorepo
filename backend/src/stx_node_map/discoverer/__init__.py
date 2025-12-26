import json
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

import requests

from stx_node_map.util import file_write, assert_env_vars

logging.basicConfig(level=logging.INFO)

this_dir = os.path.abspath(os.path.dirname(__file__))


def ip_to_location(ip: str):
    """Fetch geolocation from GeoJS.io (unlimited calls, no rate limits)"""
    url = "https://get.geojs.io/v1/geo/{}.json".format(ip)
    try:
        resp = requests.get(url, timeout=5)
    except BaseException:
        return None

    if resp.status_code != 200:
        return None

    data = resp.json()
    # Map GeoJS response to our format
    return {
        "latitude": float(data.get("latitude", 0)),
        "longitude": float(data.get("longitude", 0)),
        "country_name": data.get("country", ""),
        "city": data.get("city", "")
    }


def parse_server_version(version_str):
    """Parse server version string into components (e.g., '2.0.5.1' -> {'major': '2', 'minor': '0', 'patch': '5', 'build': '1'})"""
    if not version_str:
        return {"major": None, "minor": None, "patch": None, "build": None}
    
    parts = str(version_str).split('.')
    return {
        "major": parts[0] if len(parts) > 0 else None,
        "minor": parts[1] if len(parts) > 1 else None,
        "patch": parts[2] if len(parts) > 2 else None,
        "build": parts[3] if len(parts) > 3 else None
    }


def should_fetch_geolocation(known_nodes: dict, ip: str) -> bool:
    """Check if we should fetch geolocation for this IP (only once per month)"""
    if ip not in known_nodes:
        return True  # New node, fetch location
    
    node = known_nodes[ip]
    if "location_fetched_at" not in node:
        return True  # No timestamp, fetch location
    
    last_fetch = datetime.fromisoformat(node["location_fetched_at"])
    if datetime.utcnow() - last_fetch > timedelta(days=30):
        return True  # More than 30 days old, fetch again
    
    return False  # Recently fetched, skip


def make_core_api_url(host: str, endpoint: str = "neighbors"):
    if "stack" in host:
        return "http://{}/v2/{}".format(host, endpoint)

    return "http://{}:20443/v2/{}".format(host, endpoint)


def get_server_version(host: str):
    url = make_core_api_url(host, "info")
    try:
        resp = requests.get(url, timeout=4).json()
        return resp.get("server_version")
    except BaseException:
        return None


def get_node_info(host: str):
    """Fetch /v2/info for a node and extract server_version and burn_block_height"""
    url = make_core_api_url(host, "info")
    try:
        resp = requests.get(url, timeout=4).json()
        return {
            "server_version": resp.get("server_version"),
            "burn_block_height": resp.get("burn_block_height")
        }
    except BaseException:
        return {"server_version": None, "burn_block_height": None}


def get_neighbors(host: str):
    url = make_core_api_url(host, "neighbors")
    try:
        json = requests.get(url, timeout=4).json()
    except BaseException:
        return []

    # collect all ip addresses
    all_ = [x["ip"] for x in json["sample"]] + [x["ip"] for x in json["inbound"]] + [x["ip"] for x in json["outbound"]]

    # make the list unique
    unique = list(set(all_))

    # skip local address
    return [a for a in unique if a != "0.0.0.0"]


def scan_list(list_):
    found = []

    for address in list_:
        logging.info("Scanning {}".format(address))
        neighbors = get_neighbors(address)
        found += [n for n in neighbors if n not in found]

    return found


def rescan_nodes_info(addresses):
    """Concurrently fetch /v2/info for multiple nodes"""
    results = {}
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_address = {executor.submit(get_node_info, addr): addr for addr in addresses}
        
        for future in as_completed(future_to_address):
            address = future_to_address[future]
            try:
                info = future.result()
                results[address] = info
                logging.info("Updated info for {}: v{}".format(address, info.get("server_version", "unknown")))
            except Exception as e:
                logging.error("Error fetching info for {}: {}".format(address, e))
                results[address] = {"server_version": None, "burn_block_height": None}
    
    return results


def load_known_nodes():
    """Load known nodes from data.json"""
    save_path = os.path.join(this_dir, "..", "..", "..", "data.json")
    if not os.path.exists(save_path):
        return {}
    
    try:
        with open(save_path, 'r') as f:
            nodes = json.load(f)
        # Convert list to dict keyed by address
        return {node.get("address"): node for node in nodes if isinstance(nodes, list)}
    except BaseException:
        return {}


def worker():
    seed_nodes = assert_env_vars("DISCOVERER_SEED_NODES").split(",")
    seed = []
    
    for node in seed_nodes:
        neighbors = get_neighbors(node.strip())
        seed += [n for n in neighbors if n not in seed]
    
    print(seed)
    if len(seed) == 0:
        return

    # scan
    found = scan_list(seed)
    found += scan_list(found)
    found += scan_list(found)

    # make list unique
    found = list(set(found))

    logging.info("{} nodes found.".format(len(found)))
    logging.info("Detecting locations")

    # Load existing known nodes
    known_nodes = load_known_nodes()
    
    # Create result list, updating with info for all nodes
    result = []
    geolocation_calls = 0
    
    for address in found:
        neighbors = get_neighbors(address)
        node_info = get_node_info(address)
        
        # Check if we should fetch geolocation (only once per month)
        location = None
        if should_fetch_geolocation(known_nodes, address):
            location = ip_to_location(address)
            geolocation_calls += 1
            logging.info("Fetched geolocation for {}".format(address))
        else:
            # Use cached location if available
            if address in known_nodes and "location" in known_nodes[address]:
                location = known_nodes[address]["location"]
                logging.info("Using cached location for {}".format(address))

        if len(neighbors) > 0 and location is not None:
            logging.info("{} is a public node".format(address))

            server_version = node_info.get("server_version")
            version_parts = parse_server_version(server_version)
            
            item = {
                "address": address,
                "location": {
                    "lat": location["latitude"],
                    "lng": location["longitude"],
                    "country": location["country_name"],
                    "city": location["city"]
                },
                "server_version": server_version,
                "version": version_parts,
                "burn_block_height": node_info.get("burn_block_height"),
                "last_seen": datetime.utcnow().isoformat(),
                "location_fetched_at": datetime.utcnow().isoformat()
            }
        else:
            logging.info("{} is a private node".format(address))

            server_version = node_info.get("server_version")
            version_parts = parse_server_version(server_version)
            
            item = {
                "address": address,
                "server_version": server_version,
                "version": version_parts,
                "burn_block_height": node_info.get("burn_block_height"),
                "last_seen": datetime.utcnow().isoformat()
            }

        result.append(item)

    save_path = os.path.join(this_dir, "..", "..", "..", "data.json")
    file_write(save_path, json.dumps(result))
    logging.info("Saved {} nodes (made {} geolocation API calls)".format(len(result), geolocation_calls))


def periodic_rescan():
    """Periodically rescan info for all known nodes"""
    while True:
        time.sleep(600)  # Wait 10 minutes before first rescan
        
        logging.info("Starting periodic rescan of known nodes")
        known_nodes = load_known_nodes()
        
        if not known_nodes:
            logging.info("No known nodes to rescan")
            continue
        
        addresses = list(known_nodes.keys())
        logging.info("Rescanning {} nodes concurrently".format(len(addresses)))
        
        # Fetch info for all nodes concurrently
        updated_info = rescan_nodes_info(addresses)
        
        # Update known nodes with new info
        for address, info in updated_info.items():
            if address in known_nodes:
                known_nodes[address].update(info)
                known_nodes[address]["last_seen"] = datetime.utcnow().isoformat()
        
        # Save updated data
        save_path = os.path.join(this_dir, "..", "..", "..", "data.json")
        result = list(known_nodes.values())
        file_write(save_path, json.dumps(result))
        logging.info("Periodic rescan completed, saved {} nodes".format(len(result)))


def main():
    import threading
    
    # Start periodic rescan in a background thread
    rescan_thread = threading.Thread(target=periodic_rescan, daemon=True)
    rescan_thread.start()
    
    # Run initial discovery and periodic full scans
    while True:
        worker()
        time.sleep(120)
