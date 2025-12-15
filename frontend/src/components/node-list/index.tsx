import React from 'react';

import {Node} from "../../types";

interface Props {
    nodes: Node[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    loading?: boolean;
}

const NodeList: React.FC<Props> = ({ nodes, searchTerm, onSearchChange, loading = false }) => {
    const nodesWithLocation = nodes.filter(n => n.location);
    const nodesWithoutLocation = nodes.filter(n => !n.location);

    return <div className="row">
        <div className="col-md-12">
            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">📋 Node List ({nodes.length} nodes)</h5>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="Search by IP address, city, or country..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : nodes.length === 0 ? (
                        <div className="alert alert-info">No nodes found matching your search.</div>
                    ) : (
                        <div>
                            {nodesWithLocation.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="text-muted mb-3">
                                        📍 Geo-Located Nodes ({nodesWithLocation.length})
                                    </h6>
                                    <div className="table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>IP Address</th>
                                                    <th>Country</th>
                                                    <th>City</th>
                                                    <th>Coordinates</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {nodesWithLocation.map((node, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <code className="text-danger">{node.address}</code>
                                                        </td>
                                                        <td>{node.location?.country}</td>
                                                        <td>{node.location?.city || '-'}</td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {node.location?.lat.toFixed(2)}, {node.location?.lng.toFixed(2)}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <a
                                                                href={`http://${node.address}:20443/v2/info`}
                                                                rel="noreferrer"
                                                                target="_blank"
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                View
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {nodesWithoutLocation.length > 0 && (
                                <div>
                                    <h6 className="text-muted mb-3">
                                        🌐 Nodes Without Location Data ({nodesWithoutLocation.length})
                                    </h6>
                                    <div className="table-responsive">
                                        <table className="table table-hover table-sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>IP Address</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {nodesWithoutLocation.map((node, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <code className="text-secondary">{node.address}</code>
                                                        </td>
                                                        <td>
                                                            <a
                                                                href={`http://${node.address}:20443/v2/info`}
                                                                rel="noreferrer"
                                                                target="_blank"
                                                                className="btn btn-sm btn-outline-secondary"
                                                            >
                                                                View
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
}

export default NodeList;
