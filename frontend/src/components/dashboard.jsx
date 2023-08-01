import React, { useState } from 'react';
import { uploadFile, loginUser } from "../api";
import { Container, Card, Form, Button, Image, Col, Row, Stack } from 'react-bootstrap';

const Dashboard = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [downloadLink, setDownloadLink] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;

        // Check if the user is logged in before processing the file
        // if (!loggedIn) {
        //     alert("Please log in first to access the file processing tool.");
        //     return;
        // }

        setProcessing(true);

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
        <div>
            <br />
            <Container>
                <Row>
                    <Col md={3} ></Col>
                    <Col xs={12} lg={6}>
                        <Card style={{ color: "gray", fontSize: 15, textAlign: "center" }}>
                            <Card.Body>
                                <Card.Title style={{ color: "#0FA05D" }}>
                                    <Image src="../assets/CAMI APP.png" width={"60%"} rounded />
                                    <br />
                                    CVS File Processor
                                </Card.Title>
                                <Card.Subtitle style={{ color: "#0FA05D" }}>
                                    Upload your file, and download the processed data
                                </Card.Subtitle>
                                <Card.Text>
                                    <br />
                                    <Stack direction="horizontal" gap={3}>
                                        <div style={{width: "50%"}}>
                                            <Form.Control
                                                type="file"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleFileUpload}
                                            disabled={processing}
                                        >
                                            {processing ? "Processing..." : "Upload & Process"}
                                        </Button>
                                        {downloadLink && (
                                            <>
                                                <div className="vr" />
                                                <Button
                                                    onClick={handleDownload}
                                                    className="py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring focus:ring-green-300 mt-4"
                                                >
                                                    Download Processed CSV
                                                </Button>
                                            </>
                                        )}
                                    </Stack>
                                    <br />
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}></Col>
                </Row>
            </Container>
        </div>
    )
}

export default Dashboard;