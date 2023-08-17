import React, { useState, useEffect, PureComponent } from 'react';
import { Card, Form, Col, Row, Accordion, Spinner, Table, Container } from 'react-bootstrap';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const Analitics = () => {
  const [data, setData] = useState([]); // State to store fetched data

  useEffect(() => {
    // Define an async function to fetch data
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_total_facturacion'); // Replace with your API endpoint
        console.log(response)
        setData(response.data); // Update the data state with fetched data
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // Call the fetch function when the component mounts
  }, []);
  return (
    <Row>
      <Col className="justify-content-md-center">
        <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
          <Card.Title style={{ color: "#27ae60", fontSize: "24px", marginBottom: "10px" }}>
            Analitics
          </Card.Title>
          <Card.Subtitle>
            Huehuehue
          </Card.Subtitle>
          <Card.Text>
            <Container>
              {data.length > 0 ? (
                <ComposedChart
                  width={500}
                  height={400}
                  data={data}
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                >
                  <CartesianGrid stroke="#f5f5f5" />
                  <XAxis dataKey="total_tipo_venta" scale="band" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilidad" barSize={20} fill="#413ea0" />
                  <Bar dataKey="monto_facturacion" barSize={20} fill="#27ae60" />
                </ComposedChart>
              ) : (
                <p>Loading...</p>
              )}
            </Container>
          </Card.Text>
        </Card>
      </Col>
    </Row>
  )
}

export default Analitics