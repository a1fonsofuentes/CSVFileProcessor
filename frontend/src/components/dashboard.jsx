import React, { useState } from 'react';
import { uploadFile } from '../api';
import { Container, Card, Form, Button, Image, Col, Row, Stack } from 'react-bootstrap';

const Dashboard = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [downloadLink, setDownloadLink] = useState(null);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;
        setProcessing(true);
        console.log(selectedFile)
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
        <div style={{ backgroundColor: "#f0f0f0", minHeight: "100vh", padding: "20px" }}>
            <Container>
                <Row className="justify-content-md-center">
                    <Col xs={12} lg={6}>
                        <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px" }}>
                            <Card.Title style={{ color: "#27ae60", fontSize: "24px", marginBottom: "10px" }}>
                                <Stack direction="horizontal" gap={3} style={{justifyContent: "center"}}>
                                    <Image src="https://app.camiapp.net/assets/Tuerca-eb3d566b.svg" width={"18%"} rounded />
                                    <Image src="https://app.camiapp.net/assets/Logo-8a7d2727.svg" width={"35%"} rounded />
                                </Stack>
                                <br />
                                CVS File Processor
                            </Card.Title>
                            <Card.Subtitle style={{ color: "#27ae60", fontSize: "16px", marginBottom: "20px" }}>
                                Upload your file, and download the processed data
                            </Card.Subtitle>
                            <Form>
                                <Form.Control
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    onClick={handleFileUpload}
                                    variant="success"
                                    disabled={processing}
                                    style={{ marginTop: "10px", width: "100%" }}
                                >
                                    {processing ? "Processing..." : "Upload & Process"}
                                </Button>
                                {downloadLink && (
                                    <Button
                                        onClick={handleDownload}
                                        variant="success"
                                        className="mt-3"
                                        style={{ width: "100%" }}
                                    >
                                        Download Processed CSV
                                    </Button>
                                )}
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Dashboard;
