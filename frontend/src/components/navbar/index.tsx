import React from 'react';

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
            {network && <small className="ms-2 text-muted">({network})</small>}
        </Navbar.Brand>
        <Navbar.Toggle/>
        <Navbar.Collapse>
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
