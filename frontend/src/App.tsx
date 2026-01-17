import React, {useEffect, useState} from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';

import NavBar from "./components/navbar";
import InfoCard from "./components/info-card";
import Map from "./components/map";
import NodeList from "./components/node-list";
import { Footer } from "./components/footer";

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

    const load = () => {
        setLoading(true);
        loadData()
            .then(r => {
                setNetwork(r.network);
                setNodes(r.nodes);
                // Don't set filteredNodes here - let the useEffect handle it
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
        const interval = setInterval(load, 300000); // 5 minutes
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

    return (
        <div className="App">
            <NavBar network={network} />
            {error && <div className="alert alert-danger m-3">{error}</div>}
            <div className="container-fluid py-3">
                <div className="row mb-3">
                    <div className="col-md-12">
                        <div className="btn-group w-100" role="group">
                            <NavLink 
                                to="/map" 
                                className={({ isActive }: { isActive: boolean }) => isActive ? "btn btn-primary" : "btn btn-outline-primary"}
                            >
                                Map View
                            </NavLink>
                            <NavLink 
                                to="/list" 
                                className={({ isActive }: { isActive: boolean }) => isActive ? "btn btn-primary" : "btn btn-outline-primary"}
                            >
                                List View
                            </NavLink>
                        </div>
                    </div>
                </div>
                
                <InfoCard network={network} nodes={nodes} loading={loading} />
                
                <Routes>
                    <Route path="/map" element={<Map nodes={filteredNodes} loading={loading} />} />
                    <Route path="/list" element={
                        <NodeList 
                            nodes={filteredNodes} 
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            loading={loading}
                        />
                    } />
                    <Route path="/" element={<Navigate to="/map" replace />} />
                </Routes>
            </div>
            <Footer />
        </div>
    );
}

export default App;
