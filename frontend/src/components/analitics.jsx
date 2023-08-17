import React, { useState, useEffect, PureComponent } from 'react';
import { Card, Form, Col, Row, Accordion, Spinner, Table, Container } from 'react-bootstrap';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analitics = () => {
  const data = [
    {
      name: 'Page A',
      pv: 2400,
      amt: 2400,
    },
    {
      name: 'Page B',
      pv: 1398,
      amt: 2210,
    },
    {
      name: 'Page C',
      pv: 9800,
      amt: 2290,
    },
    {
      name: 'Page D',
      pv: 3908,
      amt: 2000,
    },
    {
      name: 'Page E',
      pv: 4800,
      amt: 2181,
    },
    {
      name: 'Page F',
      pv: 3800,
      amt: 2500,
    },
    {
      name: 'Page G',
      pv: 4300,
      amt: 2100,
    },
  ];
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
              <BarChart
                width={800}
                height={600}
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="pv" fill="#8884d8" />
              </BarChart>
            </Container>
          </Card.Text>
        </Card>
      </Col>
    </Row>
  )
}

export default Analitics