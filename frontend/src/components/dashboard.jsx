import React, { useState } from 'react';
import { uploadFile } from '../api';
import { Container, Card, Form, Button, Image, Col, Row, Stack, Table } from 'react-bootstrap';


const Dashboard = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [downloadLink, setDownloadLink] = useState(null);
    const [processedData, setProcessedData] = useState([]);
    const [dataProcessed, setDataProcessed] = useState(false);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleFileUpload = async () => {
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

            if (response.status === 200) {
                const contentType = response.headers.get("content-type");
                const blob = new Blob([response.data], { type: contentType });
                const url = URL.createObjectURL(blob);
                setDownloadLink(url);
                const processedArray = response.data.split("\n").map(row => row.split(","));
                setProcessedData(processedArray);
                setDataProcessed(true);
            }
        } catch (error) {
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
                                CVS File Processor
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
                {dataProcessed && (
                    <Row className="justify-content-md-center">
                        <Col>
                            <Card style={{ backgroundColor: "#ffffff", color: "#0F4526", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                                <Card.Title style={{ color: "#27ae60", fontSize: "24px", marginBottom: "10px" }}>
                                    Your processed File
                                </Card.Title>
                                <Card.Subtitle style={{ color: "#27ae60", fontSize: "16px", marginBottom: "20px" }}>
                                    You can visualize your new file here before download
                                </Card.Subtitle>
                                <Card.Text>
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
                                                        <td key={cellIndex}>{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Text>
                            </Card>
                        </Col>
                    </Row>
                )}
            </Container>
        </div>
    );
}

export default Dashboard;
