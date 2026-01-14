import React, { useRef, useEffect, useState } from 'react';

import {Map, Marker, Popup, TileLayer} from "react-leaflet";

import {Node} from "../../types";

import {DivIcon, DivIconOptions} from "leaflet";

interface Props {
    nodes: Node[];
    loading?: boolean;
}

interface LocationGroup {
    lat: number;
    lng: number;
    nodes: Node[];
    bestStatus: "api" | "p2p_only" | "offline" | undefined;
}

const NodeMap: React.FC<Props> = ({ nodes, loading = false }) => {
    const mapRef = useRef<any>(null);
    const [zoom, setZoom] = useState(2);
    const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
    const popupRefs = useRef<{[key: string]: any}>({});
    const publicCount = nodes.filter(x => x.location && x.location.country !== "Unknown" && x.location.country !== "Private IP").length;

    // Group nodes by location
    const locationGroups: LocationGroup[] = [];
    const processedLocations = new Set<string>();

    nodes.forEach(node => {
        if (!node.location || node.location.lat === 0 && node.location.lng === 0) {
            return;
        }

        const locationKey = `${node.location.lat},${node.location.lng}`;
        
        if (!processedLocations.has(locationKey)) {
            processedLocations.add(locationKey);
            const nodesAtLocation = nodes.filter(x => 
                x.location && 
                x.location.lng === node.location!.lng && 
                x.location.lat === node.location!.lat
            );

            // Determine best status: API > P2P > Offline
            let bestStatus: "api" | "p2p_only" | "offline" | undefined;
            if (nodesAtLocation.some(n => n.connection_status === "api")) {
                bestStatus = "api";
            } else if (nodesAtLocation.some(n => n.connection_status === "p2p_only")) {
                bestStatus = "p2p_only";
            } else if (nodesAtLocation.some(n => n.connection_status === "offline")) {
                bestStatus = "offline";
            }

            locationGroups.push({
                lat: node.location.lat,
                lng: node.location.lng,
                nodes: nodesAtLocation,
                bestStatus
            });
        }
    });

    const getMarkerIcon = (status?: "api" | "p2p_only" | "offline", count?: number): DivIcon => {
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

        const countBadge = count && count > 1 ? `
            <circle cx="12.5" cy="12.5" r="7" fill="white" opacity="0.95"/>
            <text x="12.5" y="12.5" text-anchor="middle" dominant-baseline="central" 
                  font-size="9" font-weight="bold" fill="${color}">${count > 99 ? '99+' : count}</text>
        ` : `
            <circle cx="12.5" cy="12.5" r="4" fill="white" opacity="0.9"/>
        `;

        const iconProps: DivIconOptions = {
            className: "map-marker-icon",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg" class="marker-svg">
                <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 1.995.476 3.878 1.319 5.547l10.348 21.307a1 1 0 001.666 0l10.348-21.307A12.465 12.465 0 0025 12.5C25 5.596 19.404 0 12.5 0z" 
                      fill="${color}" stroke="white" stroke-width="1.5"/>
                ${countBadge}
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

    // Helper to create breakout positions for multiple nodes
    const getBreakoutPosition = (baseLat: number, baseLng: number, index: number, total: number) => {
        if (total === 1) return { lat: baseLat, lng: baseLng };
        
        const radius = 0.05; // Adjust spread distance
        const angle = (2 * Math.PI * index) / total;
        return {
            lat: baseLat + radius * Math.cos(angle),
            lng: baseLng + radius * Math.sin(angle)
        };
    };

    return <div className="row">
        <div className="col-md-12">
            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">📍 Node Distribution Map ({publicCount} geo-located nodes)</h5>
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
                        onZoomEnd={() => {
                            if (mapRef.current) {
                                setZoom(mapRef.current.leafletElement.getZoom());
                            }
                        }}
                    >
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {locationGroups.map((group, groupIdx) => {
                            const locationKey = `${group.lat},${group.lng}`;
                            const isExpanded = expandedLocation === locationKey;
                            const shouldBreakout = isExpanded && zoom >= 8 && group.nodes.length > 1;

                            if (shouldBreakout) {
                                // Show individual markers in breakout pattern
                                return group.nodes.map((node, nodeIdx) => {
                                    const position = getBreakoutPosition(group.lat, group.lng, nodeIdx, group.nodes.length);
                                    const markerIcon = getMarkerIcon(node.connection_status, 1);
                                    const popupKey = `${groupIdx}-${nodeIdx}`;
                                    
                                    return <Marker 
                                        icon={markerIcon} 
                                        key={popupKey}
                                        position={position}
                                        onClick={() => {
                                            if (popupRefs.current[popupKey]) {
                                                popupRefs.current[popupKey].leafletElement.openPopup();
                                            }
                                        }}
                                    >
                                        <Popup 
                                            ref={(el) => { if (el) popupRefs.current[popupKey] = el; }}
                                            className="map-popup-content"
                                        >
                                            <div className="map-popup">
                                                <strong>{node.location?.country}</strong>
                                                {node.location?.city && <p className="mb-1">{node.location.city}</p>}
                                                <hr className="my-2" />
                                                <div className="mb-2 d-flex align-items-center justify-content-between">
                                                    <a href={`http://${node.address}:20443/v2/info`} rel="noreferrer" target="_blank" className="text-decoration-none">
                                                        {node.address}
                                                    </a>
                                                    <span className={`badge bg-${
                                                        node.connection_status === 'api' ? 'success' : 
                                                        node.connection_status === 'p2p_only' ? 'warning' : 
                                                        node.connection_status === 'offline' ? 'danger' : 'secondary'
                                                    } ms-2`}>
                                                        {node.connection_status === 'api' ? 'API' : 
                                                         node.connection_status === 'p2p_only' ? 'P2P' : 
                                                         node.connection_status === 'offline' ? 'Offline' : 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                });
                            } else {
                                // Show single marker with count badge
                                const markerIcon = getMarkerIcon(group.bestStatus, group.nodes.length);
                                const popupKey = `group-${groupIdx}`;
                                
                                return <Marker 
                                    icon={markerIcon} 
                                    key={groupIdx} 
                                    position={{ lat: group.lat, lng: group.lng }}
                                    onClick={() => {
                                        setExpandedLocation(locationKey);
                                        if (popupRefs.current[popupKey]) {
                                            popupRefs.current[popupKey].leafletElement.openPopup();
                                        }
                                    }}
                                >
                                    <Popup 
                                        ref={(el) => { if (el) popupRefs.current[popupKey] = el; }}
                                        className="map-popup-content"
                                        onClose={() => setExpandedLocation(null)}
                                    >
                                        <div className="map-popup">
                                            <strong>{group.nodes[0].location?.country}</strong>
                                            {group.nodes[0].location?.city && <p className="mb-1">{group.nodes[0].location.city}</p>}
                                            <small className="text-muted">{group.nodes.length} node{group.nodes.length > 1 ? 's' : ''}</small>
                                            <hr className="my-2" />
                                            {group.nodes.map((x, idx) => {
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
                            }
                        })}
                    </Map>
                </div>
            </div>
        </div>
    </div>
}

export default NodeMap;
