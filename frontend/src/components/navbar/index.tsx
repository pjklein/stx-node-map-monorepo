import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {Navbar, Nav} from "react-bootstrap";
import {openInNewSvg} from "../../svg";
import config from '../../config';

interface NavBarProps {
  network?: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

interface DiscoveryStatus {
    status: string;
    nodes_count: number;
    scanning: boolean;
    last_scan: string | null;
    timestamp: string;
}

const NavBar: React.FC<NavBarProps> = ({ network, theme, toggleTheme }) => {
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
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (isoString: string | null) => {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        return date.toLocaleTimeString();
    };

    return <Navbar className="main-nav-bar" expand="md" variant={theme === 'dark' ? 'dark' : 'light'} bg={theme === 'dark' ? 'dark' : 'light'} sticky="top">
        <Navbar.Brand href="#home">
            <img
                src="/logo.png"
                alt="Logo"
                height="30"
                className="d-inline-block align-top"
                style={{ marginRight: '10px' }}
            />
            <span>STX Node Map</span>
        </Navbar.Brand>
        
        <button 
            className="theme-toggle-btn d-md-none"
            onClick={toggleTheme}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
        
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
            <div className="mobile-theme-toggle d-md-none">
                <button 
                    className="theme-toggle-menu-btn"
                    onClick={toggleTheme}
                >
                    {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
                <hr />
            </div>
            
            <Nav className="ms-auto">
                <NavLink 
                    to="/map" 
                    className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link active-view" : "nav-link"}
                >
                    <span className="d-none d-sm-inline">🗺️ Map View</span>
                    <span className="d-inline d-sm-none">🗺️ Map</span>
                </NavLink>
                <NavLink 
                    to="/list" 
                    className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link active-view" : "nav-link"}
                >
                    <span className="d-none d-sm-inline">📋 List View</span>
                    <span className="d-inline d-sm-none">📋 List</span>
                </NavLink>
                
                <Nav.Link href="https://stacks.org" target="_blank">
                  Stacks {openInNewSvg}
                </Nav.Link>
                <Nav.Link href="https://docs.stacks.co" target="_blank">
                  Documentation {openInNewSvg}
                </Nav.Link>
                <Nav.Link href="https://github.com" target="_blank">
                  GitHub {openInNewSvg}
                </Nav.Link>
                
                <button 
                    className="theme-toggle-btn d-none d-md-block"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </Nav>
            
            {status && (
                <div className="footer-status-menu d-md-none">
                    <hr />
                    <div className="status-info-compact">
                        <div className="status-row">
                            <span className={`status-dot ${status.scanning ? 'scanning' : 'idle'}`}></span>
                            <span className="status-text">{status.status}</span>
                        </div>
                        <div className="status-row">
                            <span className="label">Nodes:</span> <strong>{status.nodes_count}</strong>
                        </div>
                        <div className="status-row">
                            <span className="label">Last scan:</span> {formatTime(status.last_scan)}
                        </div>
                    </div>
                </div>
            )}
        </Navbar.Collapse>
    </Navbar>
}

export default NavBar;
