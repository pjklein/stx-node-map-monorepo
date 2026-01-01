import json
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta

import requests

from stx_node_map.util import file_write, assert_env_vars

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

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

    try:
        data = resp.json()
    except:
        return None
    
    # Safely convert coordinates, handling "nil" or invalid values
    try:
        lat = data.get("latitude", 0)
        lon = data.get("longitude", 0)
        latitude = float(lat) if lat not in (None, "", "nil") else 0.0
        longitude = float(lon) if lon not in (None, "", "nil") else 0.0
    except (ValueError, TypeError):
        return None
    
    # Map GeoJS response to our format - return None if essential data is missing
    if not data.get("country") and latitude == 0.0 and longitude == 0.0:
        return None
    
    return {
        "latitude": latitude,
        "longitude": longitude,
        "country_name": data.get("country", ""),
        "city": data.get("city", "")
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
    """Fetch /v2/info for a node and extract version details and burn_block_height"""
    url = make_core_api_url(host, "info")
    try:
        resp = requests.get(url, timeout=10).json()
        
        # Parse server_version string (e.g., "stacks-node 2.5.0.0.0 (master:abc123, release, linux [x86_64])")
        server_version = resp.get("server_version", "")
        version_info = {
            "version": None,
            "commit_hash": None,
            "build_type": None,
            "platform": None
        }
        
        if server_version:
            # Extract version number - find the numeric version part after "stacks-node "
            # Example: "stacks-node 3.3.0.0.3 (6048975+, release build, linux [x86_64])"
            parts = server_version.split()
            for part in parts:
                # Look for a part that starts with a digit (version number)
                if part and part[0].isdigit():
                    # Extract just the version, removing any trailing parenthesis
                    version_info["version"] = part.split("(")[0]
                    break
            
            # Extract commit, build type, and platform from parentheses
            if "(" in server_version and ")" in server_version:
                paren_content = server_version[server_version.find("(")+1:server_version.find(")")]
                paren_parts = [p.strip() for p in paren_content.split(",")]
                
                if len(paren_parts) > 0 and paren_parts[0]:
                    # Commit hash (e.g., "master:abc123" or "abc123" or "6048975+")
                    commit_part = paren_parts[0]
                    if ":" in commit_part:
                        version_info["commit_hash"] = commit_part.split(":")[1]
                    else:
                        version_info["commit_hash"] = commit_part
                
                # Build type might be "release build" or just "release"
                for part in paren_parts[1:]:
                    if "release" in part.lower() or "debug" in part.lower():
                        version_info["build_type"] = part
                        break
                
                # Platform is usually the last part with brackets
                for part in paren_parts:
                    if "[" in part and "]" in part:
                        version_info["platform"] = part
                        break
        
        return {
            "server_version": server_version,
            "version": version_info,
            "burn_block_height": resp.get("burn_block_height")
        }
    except BaseException:
        return {
            "server_version": None,
            "version": {"version": None, "commit_hash": None, "build_type": None, "platform": None},
            "burn_block_height": None
        }


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
                version_str = info.get("version", {}).get("version", "unknown")
                logging.info("Updated info for {}: v{}".format(address, version_str))
            except Exception as e:
                logging.error("Error fetching info for {}: {}".format(address, e))
                results[address] = {
                    "server_version": None,
                    "version": {"version": None, "commit_hash": None, "build_type": None, "platform": None},
                    "burn_block_height": None
                }
    
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


def check_schema_version(known_nodes):
    """Check if data.json has old schema (major/minor/patch/build) vs new (version/commit_hash/build_type/platform)"""
    if not known_nodes:
        return True  # Empty or no data, schema is fine
    
    # Check first node for old schema indicators
    sample_node = next(iter(known_nodes.values()))
    version_data = sample_node.get("version", {})
    
    # Old schema has major/minor/patch/build
    if "major" in version_data or "minor" in version_data:
        logging.warning("⚠️  Detected old schema in data.json - triggering full rescan")
        return False
    
    return True


def write_status(status, nodes_count=0, scanning=False, last_scan=None):
    """Write discovery status to status.json"""
    status_path = os.path.join(this_dir, "..", "..", "..", "status.json")
    status_data = {
        "status": status,
        "nodes_count": nodes_count,
        "scanning": scanning,
        "last_scan": last_scan or datetime.utcnow().isoformat(),
        "timestamp": datetime.utcnow().isoformat()
    }
    file_write(status_path, json.dumps(status_data))


def worker():
    write_status("Starting discovery walk", scanning=True)
    
    # Check if schema is outdated
    known_nodes = load_known_nodes()
    schema_valid = check_schema_version(known_nodes)
    
    if not schema_valid:
        logging.info("🔄 Schema migration needed - performing full network scan")
        known_nodes = {}  # Clear cached data to force fresh scan
    
    seed_nodes = assert_env_vars("DISCOVERER_SEED_NODES").split(",")
    seed = []
    
    for node in seed_nodes:
        neighbors = get_neighbors(node.strip())
        seed += [n for n in neighbors if n not in seed]
    
    print(seed)
    if len(seed) == 0:
        write_status("No seed nodes found", scanning=False)
        return

    # scan
    write_status("Scanning network", len(seed), scanning=True)
    found = scan_list(seed)
    found += scan_list(found)
    found += scan_list(found)

    # make list unique
    found = list(set(found))

    logging.info("{} nodes found.".format(len(found)))
    logging.info("Detecting locations")
    write_status("Fetching geolocation", len(found), scanning=True)

    # known_nodes was already loaded and validated at start of worker()
    # If schema was invalid, it was cleared to force fresh geolocation
    
    # Create result list, updating with info for all nodes
    result = []
    geolocation_calls = 0
    geolocation_successes = 0
    geolocation_failures = 0
    
    # Log geolocation attempts
    geoloc_log = os.path.join(this_dir, "..", "..", "..", "logs", "geolocation.log")
    os.makedirs(os.path.dirname(geoloc_log), exist_ok=True)
    
    for address in found:
        neighbors = get_neighbors(address)
        node_info = get_node_info(address)
        
        # Check if we should fetch geolocation (only once per month)
        location = None
        if should_fetch_geolocation(known_nodes, address):
            location = ip_to_location(address)
            geolocation_calls += 1
            if location is not None:
                geolocation_successes += 1
                logging.info("✓ Fetched geolocation for {}: {}, {}".format(address, location["city"], location["country_name"]))
                with open(geoloc_log, "a") as f:
                    f.write("{} | {} | SUCCESS | {}, {}\n".format(datetime.utcnow().isoformat(), address, location["city"], location["country_name"]))
            else:
                geolocation_failures += 1
                logging.warning("✗ Failed geolocation for {}".format(address))
                with open(geoloc_log, "a") as f:
                    f.write("{} | {} | FAILURE\n".format(datetime.utcnow().isoformat(), address))
        else:
            # Use cached location if available
            if address in known_nodes and "location" in known_nodes[address]:
                location = known_nodes[address]["location"]
                logging.info("Using cached location for {}".format(address))

        # Determine node type based on neighbors
        is_public = len(neighbors) > 0
        node_type = "public" if is_public else "private"
        
        # Build base item with info available to all nodes
        item = {
            "address": address,
            "server_version": node_info.get("server_version"),
            "version": node_info.get("version"),
            "burn_block_height": node_info.get("burn_block_height"),
            "last_seen": datetime.utcnow().isoformat(),
            "node_type": node_type
        }
        
        # Add location if available (for both public and private nodes)
        if location is not None:
            try:
                # Handle both new format (latitude/longitude) and cached format (lat/lng)
                lat = location.get("latitude") or location.get("lat", 0.0)
                lng = location.get("longitude") or location.get("lng", 0.0)
                country = location.get("country_name") or location.get("country", "Unknown")
                city = location.get("city", "")
                
                item["location"] = {
                    "lat": lat,
                    "lng": lng,
                    "country": country if country else "Unknown",
                    "city": city if city else ""
                }
                item["location_fetched_at"] = datetime.utcnow().isoformat()
                logging.info("{} is a {} node with location".format(address, node_type))
            except Exception as e:
                logging.error("Error processing location for {}: {}".format(address, e))
                # Fall back to Unknown location
                item["location"] = {
                    "lat": 0.0,
                    "lng": 0.0,
                    "country": "Unknown",
                    "city": ""
                }
        elif not is_public:
            # Private node without geolocation - mark as "Private"
            item["location"] = {
                "lat": 0.0,
                "lng": 0.0,
                "country": "Private",
                "city": ""
            }
            logging.info("{} is a private node (no geolocation attempted)".format(address))
        else:
            # Public node but geolocation failed - mark as "Unknown"
            item["location"] = {
                "lat": 0.0,
                "lng": 0.0,
                "country": "Unknown",
                "city": ""
            }
            logging.info("{} is a public node but geolocation failed".format(address))

        result.append(item)

    save_path = os.path.join(this_dir, "..", "..", "..", "data.json")
    file_write(save_path, json.dumps(result))
    logging.info("Saved {} nodes (made {} geolocation API calls, {} success, {} failures)".format(
        len(result), geolocation_calls, geolocation_successes, geolocation_failures))


def periodic_rescan():
    """Periodically rescan info for all known nodes"""
    while True:
        time.sleep(300)  # Wait 5 minutes before first rescan
        
        logging.info("Starting periodic rescan of known nodes")
        write_status("Periodic rescan", scanning=True)
        known_nodes = load_known_nodes()
        
        if not known_nodes:
            logging.info("No known nodes to rescan")
            write_status("Idle", 0, scanning=False)
            continue
        
        addresses = list(known_nodes.keys())
        logging.info("Rescanning {} nodes concurrently with 10s timeout".format(len(addresses)))
        
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
        write_status("Idle", len(result), scanning=False)


def main():
    import threading
    
    # Start periodic rescan in a background thread
    rescan_thread = threading.Thread(target=periodic_rescan, daemon=True)
    rescan_thread.start()
    
    # Run initial discovery and periodic full scans
    while True:
        worker()
        time.sleep(120)
