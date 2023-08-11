import React, { useState, useEffect } from 'react';
import { uploadFile } from '../api';
import { Bounce, Slide, toast, } from 'react-toastify';
import { Container, Card, Form, Button, Image, Col, Row, Stack, Table, Nav, Accordion } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import Historico from './historico';
import supabase from './db';


const Dashboard = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [downloadLink, setDownloadLink] = useState(null);
    const [processedData, setProcessedData] = useState([]);
    const [dataProcessed, setDataProcessed] = useState(false);
    const [nav, setNav] = useState(false)
    const years = [2020, 2021, 2022]


    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleFileUpload = async () => {
        toast.info('Processing...', { autoClose: 6000, toastId: 'toast' });
        if (!selectedFile) return;
        setProcessing(true);
        // Check if the user is logged in before processing the file
        if (!localStorage.getItem("user")) {
            alert("Please log in first to access the file processing tool.");
            return;
        }
 
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await uploadFile(formData);

            const controllerResponse = await supabase
                .from('controller')
                .insert([{}]).select();
            if (controllerResponse.error) {
                console.error('Error inserting row:', error);
                toast.error(error, {
                    position: toast.POSITION.TOP_RIGHT,
                    autoClose: 3000, //3 seconds
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    transition: Bounce
                });
            } else {
                console.log(controllerResponse)
                const controllerId = controllerResponse.data[0].id;
                for (let rowIndex = 1; rowIndex < processedData.length; rowIndex++) {
                    const row = processedData[rowIndex];
                    const { data, error } = await supabase
                        .from('data')
                        .insert([
                            {
                                year: row[0],
                                month: row[1],
                                total_tipo_venta: row[2],
                                producto: row[3],
                                cuenta: row[4],
                                monto_facturacion: row[5],
                                costo_detalle_facturacion: row[6],
                                utilidad: row[7],
                                margin: row[8],
                                upload: controllerId
                            },
                        ]);

                    if (error) {
                        console.error('Error inserting row:', error);
                        toast.error(error, {
                            position: toast.POSITION.TOP_RIGHT,
                            autoClose: 3000, //3 seconds
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            transition: Bounce
                        });
                    } else {
                        console.log('Row inserted:', data);
                        toast.update('toast', {
                            render: 'success',
                            type: toast.TYPE.SUCCESS,
                            position: toast.POSITION.TOP_RIGHT,
                            autoClose: 3000, //3 seconds
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            transition: Slide
                        });
                    }
                }
                if (response.status === 200) {
                    const contentType = response.headers.get("content-type");
                    const blob = new Blob([response.data], { type: contentType });
                    const url = URL.createObjectURL(blob);
                    setDownloadLink(url);
                    const processedArray = response.data.split("\n").map(row => row.split(","));
                    setProcessedData(processedArray);
                    setDataProcessed(true);
                }
            }
        } catch (error) {
            toast.error(error, {
                position: toast.POSITION.TOP_RIGHT,
                autoClose: 3000, //3 seconds
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                transition: Bounce
            });
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleDownload = () => {
        if (downloadLink) {
            const tempLink = document.createElement("a");
            tempLink.href = downloadLink;
            tempLink.setAttribute("download", "processed_data.csv");
            tempLink.click();
        }
    };

    const handleTabSelect = (selectedKey) => {
        if (selectedKey === 'file') {
            setNav(false);
        } else if (selectedKey === 'linkHistorico') {
            setNav(true);
        }
    };

    return (
        <div style={{ backgroundColor: "#3E6A51", minHeight: "100vh", padding: "20px" }}>
            <Container>
                <Row className="justify-content-md-center">
                    <Col>
                        <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                            <Card.Title style={{ color: "#27ae60", fontSize: "24px", marginBottom: "10px" }}>
                                <Stack direction="horizontal" gap={3} style={{ justifyContent: "center" }}>
                                    <Image src="https://app.camiapp.net/assets/Tuerca-eb3d566b.svg" width={"15%"} rounded />
                                    <Image src="https://app.camiapp.net/assets/Logo-8a7d2727.svg" width={"25%"} rounded />
                                </Stack>
                                <br />
                                CSV File Processor
                            </Card.Title>
                            <Card.Subtitle style={{ color: "#27ae60", fontSize: "16px", marginBottom: "20px" }}>
                                Upload your file, and download the processed data
                            </Card.Subtitle>
                            <Card.Text>
                                <Container style={{ width: "23%" }}>
                                    <Form.Control
                                        type='file'
                                        onChange={handleFileChange}
                                    />
                                </Container>
                                <br />
                                <Button
                                    onClick={handleFileUpload}
                                    variant="success"
                                    disabled={processing}
                                    style={{ width: "50%" }}
                                >
                                    {processing ? "Processing..." : "Upload & Process"}
                                </Button>
                                <br />
                                <br />
                                {downloadLink && (
                                    <Button
                                        onClick={handleDownload}
                                        variant="success"
                                        className="mt-3"
                                        style={{ width: "50%" }}
                                    >
                                        Download Processed CSV
                                    </Button>
                                )}
                            </Card.Text>
                        </Card>
                    </Col>
                </Row>
                <br />
                <Row>
                    <Col>
                        <Nav variant="tabs" defaultActiveKey={'file'} onSelect={handleTabSelect}>
                            <Nav.Item>
                                <Nav.Link eventKey={'file'} style={{ color: (!nav ? '#1F3528' : '#B1C3B9'), }}>Visualizar Archivo Procesado</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey={'linkHistorico'} style={{ color: (nav ? '#1F3528' : '#B1C3B9'), }}>Historico</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Col>
                </Row>
                {nav && (
                    <Historico />
                )}
                {processing ? (
                    <div className="text-center">
                        <br /><br /><br /><Spinner animation="border" variant="warning" />
                    </div>
                ) : (
                    dataProcessed && !nav && (
                        <Row className="justify-content-md-center">
                            <Col>
                                <Table striped hover variant="dark">
                                    <Table striped hover variant='dark'>
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
                                    </Table>
                                </Table>
                            </Col>
                        </Row>
                    ))}
            </Container>
        </div>
    );
}
export default Dashboard;