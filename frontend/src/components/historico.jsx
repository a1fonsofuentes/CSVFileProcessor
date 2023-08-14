import React, { useState, useEffect } from 'react';
import { Card, Form, Col, Row, Accordion, Spinner, Table } from 'react-bootstrap';
import supabase from './db';

const Historico = () => {
    const [processedData, setProcessedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const Header = ["Mes Detalle", "TOTAL Tipo de Venta", "Producto (Producto Oportunidad)", "Cuenta", "Monto Facturación", "Costo Detalle Facturación", "Utilidad", "Margen %"]
    const years = [2020, 2021, 2022]
    useEffect(() => {
        // Fetch data from Supabase and process it
        async function fetchData() {
            const { data, error } = await supabase
                .from('data')
                .select('*');
            if (error) {
                console.error('Error fetching data:', error);
            } else {
                // Process the data into an array of arrays
                const processed = data.map(row => [
                    row.year,
                    row.month,
                    row.total_tipo_venta,
                    row.producto,
                    row.cuenta,
                    row.monto_facturacion,
                    row.costo_detalle_facturacion,
                    row.utilidad,
                    row.margin
                ]);
                setProcessedData(processed);
                setLoading(true)
            }
        }
        fetchData();
    }, []);

    const filteredData = selectedYear ? processedData.filter(row => row[0] === selectedYear) : processedData;

    return (
        <Row>
            <Col className="justify-content-md-center">
                {loading ?
                    (<Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                        <Card.Title style={{ color: "#27ae60", fontSize: "24px", marginBottom: "10px" }}>
                            Lista de archivos procesados
                        </Card.Title>
                        <Card.Body>
                            <Form.Select size="sm">
                                {years.map(item => (
                                    <option value={item}>{item}</option>
                                ))}
                            </Form.Select>
                            <br />
                            <Accordion flush>
                                <Accordion.Item eventKey="1">
                                    <Accordion.Header>Update fecha 02/02/2023</Accordion.Header>
                                    <Accordion.Body>
                                        <Table striped hover variant='dark'>
                                            <thead>
                                                <tr>
                                                    {Header.map((header, index) => (
                                                        <th key={index}>{header}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        {row.slice(1).map((cell, cellIndex) => (
                                                            <td key={cellIndex} style={{ color: '#B1C3B9' }}>
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </Card.Body>
                    </Card>) :
                    (<div className="text-center">
                        <br /><br /><br /><Spinner animation="border" variant="warning" />
                    </div>)}
            </Col>
        </Row>
    )
}

export default Historico;