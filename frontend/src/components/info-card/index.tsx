import React from 'react';

import CountUp from "react-countup";

import {Node} from "../../types";

interface Props {
    network: string;
    nodes: Node[];
    loading?: boolean;
}

const InfoCard: React.FC<Props> = ({ network, nodes, loading = false }) => {
    const totalNodes = nodes.length;
    const nodesWithLocation = nodes.filter(n => n.location && n.location.country !== "Unknown" && n.location.country !== "Private IP").length;
    const uniqueCountries = new Set(nodes.filter(n => n.location && n.location.country !== "Unknown" && n.location.country !== "Private IP").map(n => n.location?.country)).size;
    
    // Count nodes by connection status
    const apiNodes = nodes.filter(n => n.connection_status === "api").length;
    const p2pNodes = nodes.filter(n => n.connection_status === "p2p_only").length;
    const offlineNodes = nodes.filter(n => n.connection_status === "offline").length;

    return <div className="row mb-2">
        <div className="col-12 col-sm-6 col-md-3 mb-2">
            <div className="card h-100 shadow-sm">
                <div className="card-body py-2 px-3">
                    <h6 className="card-title text-muted mb-1" style={{fontSize: '0.75rem'}}>Total Nodes</h6>
                    <h2 className="text-primary mb-0" style={{fontSize: '1.75rem'}}>
                        {loading ? '...' : <CountUp end={totalNodes} duration={1} />}
                    </h2>
                    <small className="text-muted" style={{fontSize: '0.7rem'}}>{network}</small>
                </div>
            </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3 mb-2">
            <div className="card h-100 shadow-sm">
                <div className="card-body py-2 px-3">
                    <h6 className="card-title text-muted mb-1" style={{fontSize: '0.75rem'}}>Geo-Located</h6>
                    <h2 className="text-success mb-0" style={{fontSize: '1.75rem'}}>
                        {loading ? '...' : <CountUp end={nodesWithLocation} duration={1} />}
                    </h2>
                    <small className="text-muted" style={{fontSize: '0.7rem'}}>{((nodesWithLocation / totalNodes) * 100).toFixed(1)}%</small>
                </div>
            </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3 mb-2">
            <div className="card h-100 shadow-sm">
                <div className="card-body py-2 px-3">
                    <h6 className="card-title text-muted mb-1" style={{fontSize: '0.75rem'}}>Countries</h6>
                    <h2 className="text-info mb-0" style={{fontSize: '1.75rem'}}>
                        {loading ? '...' : <CountUp end={uniqueCountries} duration={1} />}
                    </h2>
                    <small className="text-muted" style={{fontSize: '0.7rem'}}>Worldwide Distribution</small>
                </div>
            </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3 mb-2">
            <div className="card h-100 shadow-sm">
                <div className="card-body py-2 px-3">
                    <h6 className="card-title text-muted mb-1" style={{fontSize: '0.75rem'}}>Connection Status</h6>
                    <div className="mt-1">
                        <div className="d-flex align-items-center mb-1">
                            <span className="legend-color-box" style={{backgroundColor: '#28a745'}}></span>
                            <small className="ms-2" style={{fontSize: '0.7rem'}}>API ({loading ? '?' : apiNodes})</small>
                        </div>
                        <div className="d-flex align-items-center mb-1">
                            <span className="legend-color-box" style={{backgroundColor: '#ffc107'}}></span>
                            <small className="ms-2" style={{fontSize: '0.7rem'}}>P2P Only ({loading ? '?' : p2pNodes})</small>
                        </div>
                        <div className="d-flex align-items-center mb-1">
                            <span className="legend-color-box" style={{backgroundColor: '#dc3545'}}></span>
                            <small className="ms-2" style={{fontSize: '0.7rem'}}>Offline ({loading ? '?' : offlineNodes})</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default InfoCard;
