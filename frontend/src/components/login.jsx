import React, { useState } from 'react';
import { uploadFile, loginUser } from "../api";
import { Container, Card, Form, Button, Image, Col, Row } from 'react-bootstrap';

const Login = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState(""); // Add state for username
    const [password, setPassword] = useState(""); // Add state for password
    const handleLogin = async () => {
        console.log(username)
        console.log(password)
        try {
            // Check if both username and password are provided
            if (!username || !password) {
                alert("Please enter both username and password.");
                return;
            }

            // Call the loginUser function with the provided credentials
            const response = await loginUser(username, password);

            if (response.status === 200) {
                // Set the logged-in state to true if login is successful
                setLoggedIn(true);
                alert("Login successful. You can now use the file processing tool.");
            } else {
                // If login is unsuccessful, show an error message
                alert("Login failed. Please check your username and password.");
            }
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <div>
            <br />
            <Container>
                <Row>
                    <Col md={4} ></Col>
                    <Col xs={12} lg={4}>
                        <Card style={{ color: "gray", fontSize: 15 }}>
                            <Card.Body>
                                <Card.Title style={{ color: "#0FA05D" }}>
                                    <Image src="../assets/CAMI APP.png" width={"60%"} rounded />
                                    <br />
                                    <br />
                                    Hello! This is a Log In
                                </Card.Title>
                                <Card.Subtitle style={{ color: "#0FA05D" }}>
                                    Sup fam!
                                </Card.Subtitle>
                                <Card.Text>
                                    <br />
                                    <Form.Label htmlFor="user">Email</Form.Label>
                                    <Form.Control
                                        id="inputUser"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        aria-describedby="userHelp"
                                    />
                                    <Form.Text id="userHelp" muted>
                                        Enter your Email address.
                                    </Form.Text>
                                    <br />
                                    <br />
                                    <Form.Label htmlFor="inputPassword5">Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        id="inputPassword"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        aria-describedby="passwordHelpBlock"
                                    />
                                    <Form.Text id="passwordHelpBlock" muted>
                                        Enter Your password
                                    </Form.Text>
                                    <br />
                                    <br />
                                    <Button variant="primary" onClick={handleLogin}>
                                        Log In
                                    </Button>
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}></Col>
                </Row>
            </Container>
        </div>
    );
};

export default Login;
