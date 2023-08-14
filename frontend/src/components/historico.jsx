import React, { useState, useEffect } from 'react';
import { Card, Form, Col, Row, Accordion, Spinner, Table } from 'react-bootstrap';
import supabase from './db';

const Historico = () => {
    const [uploadData, setUploadData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const Header = ["Mes Detalle", "TOTAL Tipo de Venta", "Producto (Producto Oportunidad)", "Cuenta", "Monto Facturación", "Costo Detalle Facturación", "Utilidad", "Margen %"];
    const [years, setYears] = useState([]);

    useEffect(() => {
        // Fetch data from Supabase for both tables
        async function fetchData() {
            const { data: controllerData, error: controllerError } = await supabase
                .from('controller')
                .select('*');

            const { data: dataData, error: dataError } = await supabase
                .from('data')
                .select('*');

            if (controllerError || dataError) {
                console.error('Error fetching data:', controllerError || dataError);
            } else {
                // Organize the data by upload date
                const uploads = controllerData.map(controllerRow => ({
                    uploadDate: controllerRow.fecha,
                    data: dataData.filter(dataRow => dataRow.upload === controllerRow.id).map(row => [
                        row.year,
                        row.month,
                        row.total_tipo_venta,
                        row.producto,
                        row.cuenta,
                        row.monto_facturacion,
                        row.costo_detalle_facturacion,
                        row.utilidad,
                        row.margin
                    ])
                }));

                setUploadData(uploads);

                // Extract unique years from the data
                const uniqueYears = [...new Set(dataData.map(row => row.year))];
                setYears(uniqueYears);

                setLoading(true);
            }
        }

        fetchData();
    }, []);

    const filteredData = selectedYear ? uploadData.map(upload => ({
        ...upload,
        data: upload.data.filter(row => row[0] === selectedYear)
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
                                {years.map(item => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </Form.Select>
                            <br />
                            <Accordion flush>
                                {filteredData.map((upload, index) => (upload.data.length > 0 && (
                                    <Accordion.Item key={index} eventKey={index.toString()}>
                                        <Accordion.Header> {upload.data[0][0]} - 
                                        <br />Archivo Subido el:{' '}
                                            {new Date(upload.uploadDate).toLocaleString('es-MX', {
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric'
                                            })}
                                        </Accordion.Header>
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
                                                    {upload.data.map((row, rowIndex) => (
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
                                )))}
                            </Accordion>
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
