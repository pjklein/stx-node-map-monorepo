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

    return <div className="info-bar-mobile mb-2">
        <div className="primary-stat">
            <div className="stat-value">{loading ? '...' : <CountUp end={totalNodes} duration={1} />}</div>
            <div className="stat-label">Nodes</div>
        </div>
        <div className="separator"></div>
        <div className="secondary-stats">
            <div className="stat-item">
                <span className="stat-icon">📍</span>
                <span className="stat-text">{loading ? '?' : nodesWithLocation}</span>
            </div>
            <div className="stat-item">
                <span className="stat-icon">🌍</span>
                <span className="stat-text">{loading ? '?' : uniqueCountries}</span>
            </div>
            <div className="stat-item status-compact">
                <span className="status-dot" style={{backgroundColor: '#28a745'}}></span>
                <span className="stat-text">{loading ? '?' : apiNodes}</span>
                <span className="status-dot" style={{backgroundColor: '#ffc107', marginLeft: '4px'}}></span>
                <span className="stat-text">{loading ? '?' : p2pNodes}</span>
                <span className="status-dot" style={{backgroundColor: '#dc3545', marginLeft: '4px'}}></span>
                <span className="stat-text">{loading ? '?' : offlineNodes}</span>
            </div>
        </div>
    </div>
}

export default InfoCard;
