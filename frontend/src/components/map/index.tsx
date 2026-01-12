import React, { useRef, useEffect } from 'react';

import {Map, Marker, Popup, TileLayer} from "react-leaflet";

import {Node} from "../../types";

import {DivIcon, DivIconOptions} from "leaflet";

interface Props {
    nodes: Node[];
    loading?: boolean;
}

const NodeMap: React.FC<Props> = ({ nodes, loading = false }) => {
    const mapRef = useRef<any>(null);
    const publicCount = nodes.filter(x => x.location && x.location.country !== "Unknown" && x.location.country !== "Private IP").length;

    const getMarkerIcon = (status?: "api" | "p2p_only" | "offline"): DivIcon => {
        let color = '#6c757d'; // Default gray
        let label = 'Unknown';
        
        switch(status) {
            case 'api':
                color = '#28a745'; // Green
                label = 'Online (API)';
                break;
            case 'p2p_only':
                color = '#ffc107'; // Yellow/Orange
                label = 'P2P Only';
                break;
            case 'offline':
                color = '#dc3545'; // Red
                label = 'Offline';
                break;
        }

        const iconProps: DivIconOptions = {
            className: "map-marker-icon",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg" class="marker-svg">
                <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 1.995.476 3.878 1.319 5.547l10.348 21.307a1 1 0 001.666 0l10.348-21.307A12.465 12.465 0 0025 12.5C25 5.596 19.404 0 12.5 0z" 
                      fill="${color}" stroke="white" stroke-width="1.5"/>
                <circle cx="12.5" cy="12.5" r="4" fill="white" opacity="0.9"/>
            </svg>`
        }
        return new DivIcon(iconProps);
    };

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
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">📍 Node Distribution Map ({publicCount} geo-located nodes)</h5>
                    <div className="map-legend d-flex gap-3">
                        <span className="legend-item"><span className="legend-dot" style={{backgroundColor: '#28a745'}}></span> API</span>
                        <span className="legend-item"><span className="legend-dot" style={{backgroundColor: '#ffc107'}}></span> P2P Only</span>
                        <span className="legend-item"><span className="legend-dot" style={{backgroundColor: '#dc3545'}}></span> Offline</span>
                        <span className="legend-item"><span className="legend-dot" style={{backgroundColor: '#6c757d'}}></span> Unknown</span>
                    </div>
                </div>
                <div className="card-body p-0">
                    <Map 
                        key="main-map"
                        ref={mapRef}
                        center={[20.00, 12.00]} 
                        zoom={2}
                        dragging={true}
                        touchZoom={true}
                        scrollWheelZoom={true}
                        doubleClickZoom={true}
                        className="the-map" 
                        style={{ height: '500px', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {nodes.map((node, i) => {
                            if (!node.location) {
                                return null;
                            }

                            // Skip nodes at 0,0 (Unknown locations)
                            if (node.location.lat === 0 && node.location.lng === 0) {
                                return null;
                            }

                            // Search for nodes on same location
                            const rNodes = nodes.filter(x => x.location && (x.location.lng === node.location!.lng && x.location.lat === node.location!.lat));
                            const markerIcon = getMarkerIcon(node.connection_status);

                            return <Marker icon={markerIcon} key={i} position={{ lat: node.location.lat, lng: node.location.lng }}>
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

                                            const { address, connection_status } = x;
                                            const href = `http://${address}:20443/v2/info`;
                                            const statusBadge = connection_status === 'api' ? 'success' : 
                                                              connection_status === 'p2p_only' ? 'warning' : 
                                                              connection_status === 'offline' ? 'danger' : 'secondary';
                                            const statusLabel = connection_status === 'api' ? 'API' : 
                                                              connection_status === 'p2p_only' ? 'P2P' : 
                                                              connection_status === 'offline' ? 'Offline' : 'Unknown';

                                            return <div key={idx} className="mb-2 d-flex align-items-center justify-content-between">
                                                <a href={href} rel="noreferrer" target="_blank" className="text-decoration-none">
                                                    {address}
                                                </a>
                                                <span className={`badge bg-${statusBadge} ms-2`}>{statusLabel}</span>
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
