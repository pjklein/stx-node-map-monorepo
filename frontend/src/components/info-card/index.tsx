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
    const nodesWithLocation = nodes.filter(n => n.location && n.location.country !== "Unknown" && n.location.country !== "Private").length;
    const uniqueCountries = new Set(nodes.filter(n => n.location && n.location.country !== "Unknown" && n.location.country !== "Private").map(n => n.location?.country)).size;

    return <div className="row mb-4">
        <div className="col-md-3 mb-2">
            <div className="card h-100 shadow-sm">
                <div className="card-body">
                    <h6 className="card-title text-muted">Total Nodes</h6>
                    <h2 className="text-primary">
                        {loading ? '...' : <CountUp end={totalNodes} duration={1} />}
                    </h2>
                    <small className="text-muted">{network}</small>
                </div>
            </div>
        </div>
        <div className="col-md-3 mb-2">
            <div className="card h-100 shadow-sm">
                <div className="card-body">
                    <h6 className="card-title text-muted">Geo-Located</h6>
                    <h2 className="text-success">
                        {loading ? '...' : <CountUp end={nodesWithLocation} duration={1} />}
                    </h2>
                    <small className="text-muted">{((nodesWithLocation / totalNodes) * 100).toFixed(1)}%</small>
                </div>
            </div>
        </div>
        <div className="col-md-3 mb-2">
            <div className="card h-100 shadow-sm">
                <div className="card-body">
                    <h6 className="card-title text-muted">Countries</h6>
                    <h2 className="text-info">
                        {loading ? '...' : <CountUp end={uniqueCountries} duration={1} />}
                    </h2>
                    <small className="text-muted">Worldwide Distribution</small>
                </div>
            </div>
        </div>
        <div className="col-md-3 mb-2">
            <div className="card h-100 shadow-sm">
                <div className="card-body">
                    <h6 className="card-title text-muted">Status</h6>
                    <h2>
                        <span className="badge bg-success">Online</span>
                    </h2>
                    <small className="text-muted">Last updated now</small>
                </div>
            </div>
        </div>
    </div>
}

export default InfoCard;
