import React, { useEffect, useState } from 'react';
import config from '../../config';
import './_index.scss';

interface DiscoveryStatus {
    status: string;
    nodes_count: number;
    scanning: boolean;
    last_scan: string | null;
    timestamp: string;
}

export function Footer() {
    const [status, setStatus] = useState<DiscoveryStatus | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch(`${config.api}/status`);
                const data = await response.json();
                setStatus(data);
            } catch (error) {
                console.error('Failed to fetch status:', error);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    if (!status) {
        return null;
    }

    const formatTime = (isoString: string | null) => {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        return date.toLocaleTimeString();
    };

    return (
        <footer className="discovery-footer">
            <div className="status-indicator">
                <span className={`status-dot ${status.scanning ? 'scanning' : 'idle'}`}></span>
                <span className="status-text">{status.status}</span>
            </div>
            <div className="status-info">
                <span className="nodes-count">{status.nodes_count} nodes</span>
                {status.last_scan && (
                    <span className="last-scan">Last scan: {formatTime(status.last_scan)}</span>
                )}
            </div>
        </footer>
    );
}
