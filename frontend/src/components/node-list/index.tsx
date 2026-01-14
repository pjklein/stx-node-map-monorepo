import React, { useState } from 'react';

import {Node} from "../../types";

interface Props {
    nodes: Node[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    loading?: boolean;
}

type SortField = 'address' | 'country' | 'city' | 'version' | 'commit_hash' | 'build_type' | 'platform' | 'burn_block_height';
type SortOrder = 'asc' | 'desc';

const NodeList: React.FC<Props> = ({ nodes, searchTerm, onSearchChange, loading = false }) => {
    const [sortField, setSortField] = useState<SortField>('address');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [versionFilterMajor, setVersionFilterMajor] = useState<string>('');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getSortedAndFilteredNodes = () => {
        let filtered = nodes.filter(node => 
            node.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (node.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (node.location?.country?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Apply version filter
        if (versionFilterMajor) {
            filtered = filtered.filter(node => node.version?.version === versionFilterMajor);
        }

        const sorted = [...filtered].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch(sortField) {
                case 'address':
                    aVal = a.address;
                    bVal = b.address;
                    break;
                case 'country':
                    aVal = a.location?.country || '';
                    bVal = b.location?.country || '';
                    break;
                case 'city':
                    aVal = a.location?.city || '';
                    bVal = b.location?.city || '';
                    break;
                case 'version':
                    aVal = a.version?.version || '';
                    bVal = b.version?.version || '';
                    break;
                case 'commit_hash':
                    aVal = a.version?.commit_hash || '';
                    bVal = b.version?.commit_hash || '';
                    break;
                case 'build_type':
                    aVal = a.version?.build_type || '';
                    bVal = b.version?.build_type || '';
                    break;
                case 'platform':
                    aVal = a.version?.platform || '';
                    bVal = b.version?.platform || '';
                    break;
                case 'burn_block_height':
                    aVal = a.burn_block_height || 0;
                    bVal = b.burn_block_height || 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    };

    const getSortIndicator = (field: SortField) => {
        if (sortField !== field) return '';
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    const getUniqueVersions = () => {
        const versions = new Set(nodes.map(n => n.version?.version).filter(v => v));
        return Array.from(versions).sort().reverse();
    };

    const sortedNodes = getSortedAndFilteredNodes();

    return <div className="row">
        <div className="col-md-12">
            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">📋 Node List ({sortedNodes.length} / {nodes.length} nodes)</h5>
                </div>
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-8">
                            <input
                                type="text"
                                className="form-control form-control-lg"
                                placeholder="Search by IP address, city, or country..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="col-md-4">
                            <select
                                className="form-control form-control-lg"
                                value={versionFilterMajor}
                                onChange={(e) => setVersionFilterMajor(e.target.value)}
                            >
                                <option value="">All Versions</option>
                                {getUniqueVersions().map(v => (
                                    <option key={v} value={v}>v{v}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border" role="status">
                            </div>
                        </div>
                    ) : sortedNodes.length === 0 ? (
                        <div className="alert alert-info">No nodes found matching your filters.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-sm">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{cursor: 'pointer'}} onClick={() => handleSort('address')}>
                                            IP Address{getSortIndicator('address')}
                                        </th>
                                        <th style={{cursor: 'pointer'}} onClick={() => handleSort('country')}>
                                            Country{getSortIndicator('country')}
                                        </th>
                                        <th style={{cursor: 'pointer'}} onClick={() => handleSort('city')}>
                                            City{getSortIndicator('city')}
                                        </th>
                                        <th style={{cursor: 'pointer'}} onClick={() => handleSort('version')}>
                                            Version{getSortIndicator('version')}
                                        </th>
                                        <th style={{cursor: 'pointer'}} onClick={() => handleSort('commit_hash')}>
                                            Commit{getSortIndicator('commit_hash')}
                                        </th>
                                        <th style={{cursor: 'pointer'}} onClick={() => handleSort('build_type')}>
                                            Build Type{getSortIndicator('build_type')}
                                        </th>
                                        <th style={{cursor: 'pointer'}} onClick={() => handleSort('platform')}>
                                            Platform{getSortIndicator('platform')}
                                        </th>
                                        <th style={{cursor: 'pointer'}} onClick={() => handleSort('burn_block_height')}>
                                            Burn Height{getSortIndicator('burn_block_height')}
                                        </th>
                                        <th>Stacker DBs</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedNodes.map((node, i) => (
                                        <tr key={i}>
                                            <td>
                                                <code className="text-danger">{node.address}</code>
                                                {node.connection_status && (
                                                    <div>
                                                        {node.connection_status === 'api' && (
                                                            <span className="badge bg-success ms-2">API</span>
                                                        )}
                                                        {node.connection_status === 'p2p_only' && (
                                                            <span className="badge bg-warning ms-2">P2P Only</span>
                                                        )}
                                                        {node.connection_status === 'offline' && (
                                                            <span className="badge bg-danger ms-2">Offline</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{node.location?.country || '-'}</td>
                                            <td>{node.location?.city || '-'}</td>
                                            <td><code>{node.version?.version || '-'}</code></td>
                                            <td><code className="text-muted">{node.version?.commit_hash || '-'}</code></td>
                                            <td><small>{node.version?.build_type || '-'}</small></td>
                                            <td><small className="text-muted">{node.version?.platform || '-'}</small></td>
                                            <td>{node.burn_block_height ? node.burn_block_height.toLocaleString() : '-'}</td>
                                            <td>
                                                {node.connection_status === 'api' && node.stacker_db_count !== undefined ? (
                                                    <span className="badge bg-info">{node.stacker_db_count}</span>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
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
                    )}
                </div>
            </div>
        </div>
    </div>
}

export default NodeList;
