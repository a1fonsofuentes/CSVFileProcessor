import React, { useState } from 'react';
import { Card, Form, Col, Row, Accordion } from 'react-bootstrap';

const Historico = () => {
    return (
        <Row>
            <Col className="justify-content-md-center">
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                    <Card.Title style={{ color: "#27ae60", fontSize: "24px", marginBottom: "10px" }}>
                        Lista de archivos procesados
                    </Card.Title>
                    <Card.Body>
                        <Form.Select size="sm">
                            a
                        </Form.Select>
                        <br />
                        <Accordion flush>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>Update fecha 25/06/2023</Accordion.Header>
                                <Accordion.Body>
                                    a
                                </Accordion.Body>
                            </Accordion.Item>
                            <Accordion.Item eventKey="1">
                                <Accordion.Header>Update fecha 02/02/2023</Accordion.Header>
                                <Accordion.Body>
                                    {/* <Table striped hover variant='dark'>
                                                    <thead>
                                                        <tr>
                                                            {processedData[0].map((header, index) => (
                                                                <th key={index}>{header}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {processedData.slice(1).map((row, rowIndex) => (
                                                            <tr key={rowIndex}>
                                                                {row.map((cell, cellIndex) => (
                                                                    <td key={cellIndex} style={{ color: '#B1C3B9' }}>{cell}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table> */}
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    )
}

export default Historico;