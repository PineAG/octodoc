import { Navbar, Container, Nav } from "react-bootstrap";
import { SearchWidget } from "./SearchComponents";

export function DefaultNavBar() {
    return <Navbar expand="lg">
        <Container fluid>
            <Navbar.Brand>OctoDoc</Navbar.Brand>
            <Navbar.Toggle aria-controls="navbarSearch"/>
            <Navbar.Collapse id="navbarSearch" className="justify-content-end">
                <div style={{maxWidth: "800px"}}>
                    <SearchWidget />
                </div>
            </Navbar.Collapse>
        </Container>
    </Navbar>
}