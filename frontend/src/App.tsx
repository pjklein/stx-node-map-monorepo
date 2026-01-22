import React, {useEffect, useState} from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
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
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as 'light' | 'dark') || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

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
            <NavBar network={network} theme={theme} toggleTheme={toggleTheme} />
            {error && <div className="alert alert-danger m-2 m-md-3">{error}</div>}
            <div className="container-fluid py-2 py-md-3 px-2 px-md-3">
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
        </div>
    );
}

export default App;
