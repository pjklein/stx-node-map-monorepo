import json
import logging
import os
import time

import requests

from stx_node_map.util import file_write, assert_env_vars

logging.basicConfig(level=logging.INFO)

this_dir = os.path.abspath(os.path.dirname(__file__))


def ip_to_location(ip: str):
    url = "https://freegeoip.app/json/{}".format(ip)
    try:
        resp = requests.get(url, timeout=5)
    except BaseException:
        return None

    if resp.status_code != 200:
        return None

    return resp.json()


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

    result = []

    for address in found:
        neighbors = get_neighbors(address)
        location = ip_to_location(address)
        server_version = get_server_version(address)

        if len(neighbors) > 0 and location is not None:
            logging.info("{} is a public node".format(address))

            item = {
                "address": address,
                "location": {
                    "lat": location["latitude"],
                    "lng": location["longitude"],
                    "country": location["country_name"],
                    "city": location["city"]
                },
                "server_version": server_version
            }
        else:
            logging.info("{} is a private node".format(address))

            item = {
                "address": address,
                "server_version": server_version
            }

        result.append(item)

    save_path = os.path.join(this_dir, "..", "..", "..", "data.json")
    file_write(save_path, json.dumps(result))
    logging.info("Saved")


def main():
    while True:
        worker()
        time.sleep(120)
