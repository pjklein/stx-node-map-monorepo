import React, {useEffect, useState} from 'react';
import './App.css';

import NavBar from "./components/navbar";
import InfoCard from "./components/info-card";
import Map from "./components/map";
import NodeList from "./components/node-list";

import config from "./config";

import {Node, ApiResponse} from "./types";

const loadData = (): Promise<ApiResponse> => fetch(`${config.api}/nodes`).then(r => r.json());

function App() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [network, setNetwork] = useState<string>("")
    const [nodes, setNodes] = useState<Node[]>([]);
    const [filteredNodes, setFilteredNodes] = useState<Node[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showList, setShowList] = useState<boolean>(false);

    const load = () => {
        setLoading(true);
        loadData()
            .then(r => {
                setNetwork(r.network);
                setNodes(r.nodes);
                setFilteredNodes(r.nodes);
                setError("");
            })
            .catch(e => {
                setError(`Failed to load nodes: ${e.message}`);
                console.error(e);
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const filtered = nodes.filter(node => 
            node.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (node.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (node.location?.country?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredNodes(filtered);
    }, [searchTerm, nodes]);

    return <div className="App">
        <NavBar network={network} />
        {error && <div className="alert alert-danger m-3">{error}</div>}
        <div className="container-fluid py-3">
            <div className="row mb-3">
                <div className="col-md-12">
                    <div className="btn-group w-100" role="group">
                        <button 
                            type="button" 
                            className={`btn ${!showList ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowList(false)}
                        >
                            Map View
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${showList ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowList(true)}
                        >
                            List View
                        </button>
                    </div>
                </div>
            </div>
            
            <InfoCard network={network} nodes={nodes} loading={loading} />
            
            {showList ? (
                <NodeList 
                    nodes={filteredNodes} 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    loading={loading}
                />
            ) : (
                <Map nodes={filteredNodes} loading={loading} />
            )}
        </div>
    </div>
}

export default App;
