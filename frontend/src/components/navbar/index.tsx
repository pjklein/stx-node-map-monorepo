import React from 'react';
import { NavLink } from 'react-router-dom';

import {Navbar, Nav} from "react-bootstrap";

import {openInNewSvg} from "../../svg";

interface NavBarProps {
  network?: string;
}

const NavBar: React.FC<NavBarProps> = ({ network }) => {
    return <Navbar className="main-nav-bar" expand="md" bg="dark" sticky="top">
        <Navbar.Brand href="#home" className="text-white">
            <img
                src="/logo.png"
                alt="Logo"
                height="30"
                className="d-inline-block align-top"
                style={{ marginRight: '10px' }}
            />
            <span>STX Node Map</span>
        </Navbar.Brand>
        <Navbar.Toggle/>
        <Navbar.Collapse>
            <Nav className="me-auto ms-3">
                <NavLink 
                    to="/map" 
                    className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link text-white active-view" : "nav-link text-white-50"}
                >
                    <span className="d-none d-sm-inline">🗺️ Map View</span>
                    <span className="d-inline d-sm-none">🗺️</span>
                </NavLink>
                <NavLink 
                    to="/list" 
                    className={({ isActive }: { isActive: boolean }) => isActive ? "nav-link text-white active-view" : "nav-link text-white-50"}
                >
                    <span className="d-none d-sm-inline">📋 List View</span>
                    <span className="d-inline d-sm-none">📋</span>
                </NavLink>
            </Nav>
            <Nav className="ms-auto">
                <Nav.Link href="https://stacks.org" target="_blank" className="text-white">
                  Stacks {openInNewSvg}
                </Nav.Link>
                <Nav.Link href="https://docs.stacks.co" target="_blank" className="text-white">
                  Documentation {openInNewSvg}
                </Nav.Link>
                <Nav.Link href="https://github.com" target="_blank" className="text-white">
                  GitHub {openInNewSvg}
                </Nav.Link>
            </Nav>
        </Navbar.Collapse>
    </Navbar>
}

export default NavBar;
