import React, { useState } from 'react';
import { Container, Card, Form, Button, Image, Stack } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { environment } from '../Environment';
import axios from 'axios';

const SignUp = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            const response = await axios.post(`${environment.urlApi}signup`, {
                username: username,
                password: password,
            });
    
            if (response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                setLoggedIn(true);
    
                navigate('/dashboard');
            } else {
                console.error('Error during registration:', error);
            }
        } catch (error) {
            console.error('Error during registration:', error);
        }
    };

    const styles = {
        container: {
            marginTop: '50px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
        },
        card: {
            width: '400px',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        },
        cardTitle: {
            fontSize: '24px',
            color: "#2F4858",
            marginBottom: '20px',
            textAlign: 'center',
        },
        formLabel: {
            fontWeight: 'bold',
            marginBottom: '5px',
        },
        formInput: {
            marginBottom: '20px',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            width: '100%',
        },
        loginButton: {
            backgroundColor: '#2F4858',
            borderColor: '#2F4858',
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
        },
    };

    return (
        <Container style={styles.container}>
            <Card style={styles.card}>
                <Card.Body>
                    <Card.Title style={styles.cardTitle}>
                        <Stack direction="horizontal" gap={3} style={{ justifyContent: "center" }}>
                            <Image src="https://app.camiapp.net/assets/Tuerca-eb3d566b.svg" width={"18%"} rounded />
                            <Image src="https://app.camiapp.net/assets/Logo-8a7d2727.svg" width={"35%"} rounded />
                        </Stack>
                        <br />
                        Sign Up
                    </Card.Title>
                    <Form.Group>
                        <Form.Label style={styles.formLabel}>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.formInput}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label style={styles.formLabel}>Password</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.formInput}
                        />
                    </Form.Group>
                    <Button variant="primary" onClick={handleRegister} style={styles.loginButton}>
                        Sign Up
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SignUp;
