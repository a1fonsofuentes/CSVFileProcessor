import React, { useState, useEffect } from 'react';
import { Card, Form, Col, Row, Accordion, Spinner, Table } from 'react-bootstrap';
import axios from 'axios'; // Import axios for making HTTP requests

const Historico = () => {
    const [uploadData, setUploadData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const Header = ["Mes Detalle", "TOTAL Tipo de Venta", "Producto (Producto Oportunidad)", "Cuenta", "Monto Facturación", "Costo Detalle Facturación", "Utilidad", "Margen %"];
    const [years, setYears] = useState([]);

    useEffect(() => {
        document.title = 'Camilytics - CSV historial';
        async function fetchData() {
            try {
                const response = await axios.get('http://localhost:8000/data'); // Change the URL to match your backend endpoint
                if (response.data.processedData) {
                    const uploads = response.data.processedData.map(upload => ({
                        uploadDate: upload.uploadDate,
                        data: upload.data
                    }));
                    setUploadData(uploads);
                    setYears(uploads.map(upload => upload.data[0]?.year));
                    setLoading(true);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        fetchData();
    }, []);

    const filteredData = selectedYear ? uploadData.map(upload => ({
        ...upload,
        data: upload.data.filter(row => row.year === selectedYear)
    })) : uploadData;

    return (
        <Row>
            <Col className="justify-content-md-center">
                {loading ? (
                    <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                        <Card.Title style={{ color: "#27ae60", fontSize: "24px", marginBottom: "10px" }}>
                            Lista de archivos procesados
                        </Card.Title>
                        <Card.Body>
                            <Form.Select size="sm" onChange={e => setSelectedYear(e.target.value)}>
                                <option value="">Seleccionar año</option>
                                {[...new Set(years.filter(year => (year !== "")))].map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </Form.Select>
                            <br />
                            {console.log(filteredData)}
                            {filteredData.map((upload) => (
                                upload.data.length > 0 && (<Accordion>
                                    <Accordion.Item key={upload.uploadDate} eventKey={upload.uploadDate}>
                                        <Accordion.Header>
                                            {upload.data[0].year} - Archivo Actualizado el:{' '}
                                            {new Date(upload.uploadDate).toLocaleString('es-MX', {
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric'
                                            })}
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <Table striped hover variant="dark">
                                                <thead>
                                                    <tr>
                                                        {Header.map((header, index) => (
                                                            <th key={index}>{header}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {upload.data.map((row, rowIndex) => {
                                                        return (<tr key={rowIndex}>
                                                            <td>{row.month}</td>
                                                            <td>{row.total_tipo_venta}</td>
                                                            <td>{row.producto}</td>
                                                            <td>{row.cuenta}</td>
                                                            <td>{row.monto_facturacion}</td>
                                                            <td>{row.costo_detalle_facturacion}</td>
                                                            <td>{row.utilidad}</td>
                                                            <td>{row.margin}</td>
                                                        </tr>)
                                                    })}
                                                </tbody>
                                            </Table>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>)
                            ))}
                        </Card.Body>
                    </Card>
                ) : (
                    <div className="text-center">
                        <br /><br /><br /><Spinner animation="border" variant="warning" />
                    </div>
                )}
            </Col>
        </Row>
    );
}

export default Historico;
