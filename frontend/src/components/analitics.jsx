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
  PieChart,
  Pie,
  Cell,
  Label,
  LabelList
} from 'recharts';
import axios from 'axios';
import YearSelector from './availableYears';
import MonthSelector from './monthSelect';
import CustomPieLabel from './pielabels';
const monthNames = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Setiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre'
};

const colors = ['#818282', '#50E5CD', '#50b3e5', '#FFCF44', '#387DA0', '#84C9EC', '#61BAE7', '#ffc416', '#E5CD50'];

const Analitics = () => {
  const [data, setData] = useState([]);
  const [oportunidad, setOportunidad] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('1');
  useEffect(() => {
    // Define an async function to fetch data
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_total_facturacion');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    const fetchOportunidad = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_producto_oportunidad');
        setOportunidad(response.data.producto_oportunidad);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    const fetchClientes = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_clientes');
        setClientes(response.data.clientes);
        console.log(response.data.clientes)
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // const fetchAvailableYears = async () => {
    //   try {
    //     const response = await axios.get('http://localhost:8000/get_available_years'); will be implimented later on xdxd
    //     setAvailableYears(response.data.availableYears);
    //   } catch (error) {
    //     console.error('Error fetching available years:', error);
    //   }
    // };
    fetchOportunidad();
    fetchClientes();
    fetchData();
    // fetchAvailableYears();

  }, []);

  const filterDataByMonthAndTipoVenta = (selectedMonth) => {
    const filteredData = data.filter((entry) => entry.month === parseInt(selectedMonth) && entry.total_tipo_venta !== '– TOTAL DEL MES – ');
    const aggregatedData = filteredData.reduce((result, entry) => {
      const tipoVenta = entry.total_tipo_venta;
      const utilidad = entry.utilidad;
      const montoFacturacion = entry.monto_facturacion;

      const existingEntry = result.find(item => item.total_tipo_venta === tipoVenta);

      if (existingEntry) {
        existingEntry.utilidad_total += utilidad;
        existingEntry.monto_facturacion_total += montoFacturacion;
      } else {
        result.push({
          total_tipo_venta: tipoVenta,
          utilidad_total: utilidad,
          monto_facturacion_total: montoFacturacion,
        });
      }

      return result;
    }, []);

    return aggregatedData;
  };


  const tipoVentaTotals = data.reduce((totals, item) => {
    const { total_tipo_venta, utilidad, monto_facturacion } = item;
    if (!totals[total_tipo_venta]) {
      totals[total_tipo_venta] = {
        total_tipo_venta,
        utilidad_total: utilidad,
        monto_facturacion_total: monto_facturacion
      };
    } else {
      totals[total_tipo_venta].utilidad_total += utilidad;
      totals[total_tipo_venta].monto_facturacion_total += monto_facturacion;
    }
    return totals;
  }, {});
  const chartData = Object.values(tipoVentaTotals);
  return (
    <Row>
      <Col className="justify-content-md-center">
        <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
          <Card.Title style={{ color: "#50b3e5", fontSize: "24px", marginBottom: "10px" }}>
            Analitics
          </Card.Title>
          <Card.Subtitle>
            {/* <YearSelector selectedYear={selectedYear} onSelectYear={setSelectedYear} availableYears={availableYears} /> */}
          </Card.Subtitle>
          <Card.Text>
            {data.length > 0 ? (
              <>
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Grafica anual - Ventas</h4>
                  </Card.Title>
                  <Card.Text>
                    <img
                      src={`http://localhost:8000/get_anual_sales_line_graph_image`}
                      alt="Anual Sales Graph"
                      style={{ width: '90%' }}
                    />
                  </Card.Text>
                </Card>
                <br />
                <br />
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Grafica Mensual - Tipo de Venta</h4>
                  </Card.Title>
                  <Card.Subtitle>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      width: '100%',
                      margin: '0 auto', // This will center the div horizontally
                    }}
                    >
                      <MonthSelector selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
                    </div>
                  </Card.Subtitle>
                  <Card.Text>
                    <div style={{ width: '100%', height: 600 }}>
                      <ResponsiveContainer>
                        <ComposedChart
                          data={filterDataByMonthAndTipoVenta(selectedMonth)}
                          margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20,
                          }}
                        >
                          <CartesianGrid stroke="#50b3e5" />
                          <XAxis dataKey="total_tipo_venta" stroke="#50b3e5" />
                          <YAxis scale={'sqrt'} tickCount={15} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="utilidad_total" barSize={30} fill="#ffc416" />
                          <Bar dataKey="monto_facturacion_total" barSize={30} fill="#50b3e5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Text>
                </Card>
                <br />
                <br />
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Grafica anual - Tipo de Venta</h4>
                  </Card.Title>
                  <Card.Text>
                    <div style={{ width: '100%', height: 600 }}>
                      <ResponsiveContainer>
                        <ComposedChart
                          width={1200}
                          height={600}
                          data={chartData}
                          margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 30,
                          }}
                        >
                          <CartesianGrid stroke="#50b3e5" />
                          <XAxis dataKey="total_tipo_venta" stroke="#50b3e5" />
                          <YAxis domain={[0, 200000]} scale={'sqrt'} tickCount={15} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="utilidad_total" barSize={30} fill="#ffc416" />
                          <Bar dataKey="monto_facturacion_total" barSize={30} fill="#50b3e5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Text>
                </Card>
                <br />
                <br />
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Grafica Anual - Producto Oportunidad</h4>
                  </Card.Title>
                  <Card.Text>
                    <div style={{ width: '100%', height: 600 }}>
                      <ResponsiveContainer>
                        <ComposedChart
                          width={1200}
                          height={600}
                          data={oportunidad}
                          margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 30,
                          }}
                        >
                          {console.log(oportunidad)}
                          <CartesianGrid stroke="#50b3e5" />
                          <XAxis dataKey="producto" stroke="#50b3e5" />
                          <YAxis domain={[0, 200000]} scale={'sqrt'} tickCount={15} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="monto_facturacion" barSize={30} fill="#ffc416" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Text>
                </Card>
                <br />
                <br />
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Grafica Anual - PIE - Producto Oportunidad</h4>
                  </Card.Title>
                  <Card.Text>
                    <div style={{ width: '100%', height: 600 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            dataKey="monto_facturacion"
                            isAnimationActive={true}
                            data={oportunidad}
                            cx="50%"
                            cy="50%"
                            outerRadius='80%'
                            labelLine={false}
                            label={({
                              cx,
                              cy,
                              midAngle,
                              innerRadius,
                              outerRadius,
                              value,
                              index,
                            }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = 25 + innerRadius + (outerRadius - innerRadius);
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                              const percent = ((value / oportunidad.reduce((sum, entry) => sum + entry.monto_facturacion, 0)) * 100).toFixed(2);
                
                              // Conditionally render the label if percentage is greater than 3%
                              if (parseFloat(percent) >= 3) {
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="#818282"
                                    textAnchor={x > cx ? 'start' : 'end'}
                                    dominantBaseline="central"
                                  >
                                    {`${oportunidad[index].producto} (${percent}%)`}
                                  </text>
                                );
                              } else {
                                return null; // Return null to skip rendering the label
                              }
                            }}
                          >
                            {oportunidad.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, entry) => [`${entry.payload.producto}`, `$${value.toLocaleString()}`]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Text>
                </Card>
                <br />
                <br />
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Grafica Anual - PIE - Clientes</h4>
                  </Card.Title>
                  <Card.Text>
                    <div style={{ width: '100%', height: 600 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            dataKey="monto_facturacion"
                            isAnimationActive={true}
                            data={clientes}
                            cx="50%"
                            cy="50%"
                            outerRadius='80%'
                            labelLine={false}

                            label={({
                              cx,
                              cy,
                              midAngle,
                              innerRadius,
                              outerRadius,
                              value,
                              index,
                            }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = 25 + innerRadius + (outerRadius - innerRadius);
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);

                              const percent = ((value / clientes.reduce((sum, entry) => sum + entry.monto_facturacion, 0)) * 100).toFixed(2);

                              // Conditionally render the label if percentage is greater than 3%
                              if (parseFloat(percent) >= 3) {
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="#818282"
                                    textAnchor={x > cx ? 'start' : 'end'}
                                    dominantBaseline="central"
                                  >
                                    {`${clientes[index].cliente} (${percent}%)`}
                                  </text>
                                );
                              } else {
                                return null; // Return null to skip rendering the label
                              }
                            }}
                          >
                            {clientes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, entry) => [`${entry.payload.cliente}`, `$${value.toLocaleString()}`]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Text>
                </Card>
              </>
            ) : (
              <div className="text-center">
                <br /><br /><br /><Spinner animation="border" variant="warning" />
              </div>
            )}
            <br />
            <br />
            <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
              <Card.Title>
                <h4>Grafica anual - Ventas</h4>
              </Card.Title>
              <Card.Text>
                <img
                  src={`http://localhost:8000/get_lineal_regresion_image`}
                  alt="Lineal Regresion"
                  style={{ width: '90%' }}
                />
              </Card.Text>
            </Card>
            <br />
            <br />
          </Card.Text>
        </Card>
      </Col>
    </Row>
  )
}

export default Analitics