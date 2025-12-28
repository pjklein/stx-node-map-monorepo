import React from 'react';

import {Map, Marker, Popup, TileLayer} from "react-leaflet";

import {Node} from "../../types";

import {DivIcon, DivIconOptions} from "leaflet";

interface Props {
    nodes: Node[];
    loading?: boolean;
}

const NodeMap: React.FC<Props> = ({ nodes, loading = false }) => {
    const center = { lat: 20.00, lng: 12.00 };
    const publicCount = nodes.filter(x => x.location).length;

    const iconProps: DivIconOptions = {
        className: "map-marker-icon",
        iconSize: [24, 34],
        iconAnchor: [12, 34],
        popupAnchor: [0, -20],
        html: "<img alt='Marker' src='/marker.png' />"
    }
    const icon = new DivIcon(iconProps);

    if (loading) {
        return <div className="card shadow-sm p-5 text-center">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    }

    return <div className="row">
        <div className="col-md-12">
            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">📍 Node Distribution Map ({publicCount} geo-located nodes)</h5>
                </div>
                <div className="card-body p-0">
                    <Map center={center} zoom={2} className="the-map" style={{ height: '500px', width: '100%' }}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {nodes.map((node, i) => {
                            if (!node.location) {
                                return null;
                            }

                            // Search for nodes on same location
                            const rNodes = nodes.filter(x => x.location && (x.location.lng === node.location!.lng && x.location.lat === node.location!.lat));

                            return <Marker icon={icon} key={i} position={{ lat: node.location.lat, lng: node.location.lng }}>
                                <Popup className="map-popup-content">
                                    <div className="map-popup">
                                        <strong>{node.location.country}</strong>
                                        {node.location.city && <p className="mb-1">{node.location.city}</p>}
                                        <small className="text-muted">{rNodes.length} node{rNodes.length > 1 ? 's' : ''}</small>
                                        <hr className="my-2" />
                                        {rNodes.map((x, idx) => {
                                            if (!x.location) {
                                                return null;
                                            }

                                            const { address } = x;
                                            const href = `http://${address}:20443/v2/info`;

                                            return <div key={idx} className="mb-2">
                                                <a href={href} rel="noreferrer" target="_blank" className="text-decoration-none">
                                                    {address}
                                                </a>
                                            </div>
                                        })}
                                    </div>
                                </Popup>
                            </Marker>
                        })}
                    </Map>
                </div>
            </div>
        </div>
    </div>
}

export default NodeMap;
