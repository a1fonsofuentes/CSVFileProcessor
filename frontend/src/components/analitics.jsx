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
  LabelList,
  LineChart
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

const colors = ['#818282', '#5069E5', '#50b3e5', '#FFCF44', '#387DA0', '#FFD55B', '#61BAE7', '#ffc416', '#E5CD50'];

const Analitics = () => {
  const [data, setData] = useState([]);
  const [oportunidad, setOportunidad] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedYear, setSelectedYear] = useState();
  const [selectedYearComparison, setSelectedYearComparison] = useState();
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('1');
  const [imageKey, setImageKey] = useState(0);
  const [oportunidad1, setOportunidad1] = useState([])
  const [anualSales, setAnualSales] = useState([])
  const [comparisonData, setcomparisonData] = useState([])
  const fetchGraphs = async () => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_total_facturacion');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    const fetchAnualSales = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_anual_sales_line_graph');
        setAnualSales(response.data);
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
    const fetchOportunidad1 = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_oportunidad_anual');
        setOportunidad1(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    const fetchClientes = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_clientes');
        setClientes(response.data.clientes);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    const fetchAvailableYears = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_available_years');
        setAvailableYears(response.data.availableYears.filter((year) => year !== '' && year !== null));
      } catch (error) {
        console.error('Error fetching available years:', error);
      }
    };
    setImageKey(prevKey => prevKey + 1);
    fetchOportunidad();
    fetchClientes();
    fetchData();
    fetchAvailableYears();
    fetchOportunidad1();
    fetchAnualSales();
  }
  useEffect(() => {
    document.title = 'Camilytics - Analytics';
    fetchGraphs()
  }, [selectedYear]);

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


  const calculateTicks = (dataMax) => {
    const additionalTicks = [2500, 5000, 20000, 50000, 100000, 500000, 1000000]; // Custom tick values
    const maxTickCount = 12; // You can adjust this as needed
    let tickInterval = Math.ceil(dataMax / maxTickCount);

    // Round tickInterval to the next thousand or million
    const magnitude = Math.pow(10, Math.floor(Math.log10(tickInterval)));
    if (tickInterval > 5 * magnitude) {
      tickInterval = 10 * magnitude;
    } else if (tickInterval > 2 * magnitude) {
      tickInterval = 5 * magnitude;
    } else if (tickInterval > magnitude) {
      tickInterval = 2 * magnitude;
    }

    const ticks = [];

    // Add the custom additional ticks
    ticks.push(...additionalTicks.filter((tick) => tick <= dataMax));

    // Generate dynamic ticks
    for (let i = tickInterval; i <= dataMax; i += tickInterval) {
      ticks.push(i);
    }

    return ticks;
  };

  const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  const AnualSalesGraph = ({ comparisonData }) => {
    if (!anualSales || anualSales.length === 0) {
      return <Spinner animation="border" variant="warning" />;
    }

    // Merge comparisonData into anualSales based on the 'month' property
    const mergedData = comparisonData.length > 0
      ? anualSales.map((entry) => {
        const comparisonEntry = comparisonData.find((compEntry) => compEntry.month === entry.month);
        return {
          ...entry,
          monto_facturacion_comparacion: comparisonEntry ? comparisonEntry.monto_facturacion : 0,
        };
      })
      : anualSales;


    return (
      <ResponsiveContainer width="100%" height={600}>
        <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 40 }} data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" domain={[0, 12]} />
          <YAxis ticks={calculateTicks(Math.max(...mergedData.map(entry => entry.monto_facturacion)))} tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <Tooltip
            labelFormatter={(value) => `Month ${value}`}
            formatter={(value, name, entry) => moneyFormatter.format(value)}
          />
          <Legend />
          <Line
            key='month'
            type="monotone"
            dataKey='monto_facturacion'
            name='Ventas Totales'
            stroke={`#50b3e5`}
            strokeWidth={3}
          />
          {comparisonData.length > 0 && (
            <Line
              type="monotone"
              dataKey="monto_facturacion_comparacion"
              name="Ventas Comparación"
              stroke="red"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }


  const MultiLineChart = ({ data }) => {
    if (!data || data.length === 0) {
      return <Spinner animation="border" variant="warning" />;
    }
    const products = ['DIGITALIZACION', 'GEMALTO PVC', 'CAMI APP', 'ONBASE', 'E-POWER', 'OTROS', 'FUJITSU', 'GEMALTO', 'BIZAGI'];
    return (
      <ResponsiveContainer width="100%" height={700}>
        <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 40, }} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" domain={[1, 12]} />
          <YAxis scale={'sqrt'} ticks={calculateTicks(Math.max(...data?.map(entry => entry['GEMALTO PVC'])))} tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <Tooltip
            labelFormatter={(value) => `Month ${value}`}
            formatter={(value, name, entry) => moneyFormatter.format(value)}
          />
          <Legend />
          {products.map(product => (
            <Line
              key={product}
              type="monotone"
              dataKey={product}
              name={product}
              stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
              strokeWidth={3}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const tipoVentaTotals = data.reduce((totals, item) => {
    const { total_tipo_venta, utilidad, monto_facturacion } = item;
    if (total_tipo_venta !== '– TOTAL DEL MES – ') {
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
    }
    return totals;
  }, {});

  const handleComparisonDataReceived = (data) => {
    setcomparisonData(data); // Update the state with the received comparison data
  };

  const chartData = Object.values(tipoVentaTotals);
  return (
    <Row>
      <Col className="justify-content-md-center">
        <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
          <Card.Title style={{ color: "#50b3e5", fontSize: "24px", marginBottom: "10px" }}>
            Analytics
          </Card.Title>
          <Card.Subtitle>
            <YearSelector selectedYear={selectedYear} onSelectYear={setSelectedYear} availableYears={availableYears} post={'http://localhost:8000/update_highest_id?selected_year='} />
            <br />
          </Card.Subtitle>
          <Card.Text>
            {data.length > 0 ? (
              <>
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Gráfica anual - Ventas</h4>
                  </Card.Title>
                  <Card.Subtitle>
                    <Container>
                      <Row>
                        <Col></Col>
                        <Col></Col>
                        <Col>
                          Comparar:
                          <YearSelector selectedYear={selectedYearComparison} onSelectYear={setSelectedYearComparison} availableYears={availableYears} post={'http://localhost:8000/get_comparison_sales?selected_year='} onComparisonDataReceived={handleComparisonDataReceived} />
                        </Col>
                      </Row>
                    </Container>
                  </Card.Subtitle>
                  <Card.Text>
                    <AnualSalesGraph comparisonData={comparisonData} />
                  </Card.Text>
                </Card>
                <br />
                <br />
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Gráfica Mensual - Tipo de Venta</h4>
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
                    <div style={{ width: '100%', height: 700 }}>
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
                          <YAxis scale={'sqrt'} ticks={calculateTicks(Math.max(...filterDataByMonthAndTipoVenta(selectedMonth).map(entry => entry.monto_facturacion_total)))} tickCount={15} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                          <Tooltip
                            labelFormatter={(value) => `Month ${value}`}
                            formatter={(value, name, entry) => moneyFormatter.format(value)}
                          />
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
                    <h4>Gráfica anual - Tipo de Venta</h4>
                  </Card.Title>
                  <Card.Text>
                    <div style={{ width: '100%', height: 700 }}>
                      <ResponsiveContainer>
                        <ComposedChart
                          width={1200}
                          height={700}
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
                          <YAxis ticks={calculateTicks(Math.max(...chartData.map(entry => entry.monto_facturacion_total)))} scale={'sqrt'} tickCount={15} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                          <Tooltip
                            labelFormatter={(value) => `Month ${value}`}
                            formatter={(value, name, entry) => moneyFormatter.format(value)}
                          />
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
                    <h4>Gráfica Anual - Producto Oportunidad</h4>
                  </Card.Title>
                  <Card.Text>
                    <div style={{ width: '100%', height: 700 }}>
                      <ResponsiveContainer>
                        <ComposedChart
                          width={1200}
                          height={700}
                          data={oportunidad}
                          margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 30,
                          }}
                        >
                          <CartesianGrid stroke="#50b3e5" />
                          <XAxis dataKey="producto" stroke="#50b3e5" />
                          <YAxis ticks={calculateTicks(Math.max(...oportunidad.map(entry => entry.monto_facturacion)))} scale={'sqrt'} tickCount={15} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                          <Tooltip
                            labelFormatter={(value) => `Month ${value}`}
                            formatter={(value, name, entry) => moneyFormatter.format(value)}
                          />
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
                    <h4>Grafica Anual - Producto Oportunidad</h4>
                  </Card.Title>
                  <Card.Text>
                    <div style={{ width: '100%', height: 700 }}>
                      {MultiLineChart(oportunidad1)}
                    </div>
                  </Card.Text>
                </Card>
                <br />
                <br />
                <Card style={{ backgroundColor: "#ffffff", color: "#333", fontSize: 15, textAlign: "center", padding: "20px", borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', }}>
                  <Card.Title>
                    <h4>Gráfica Anual - PIE - Producto Oportunidad</h4>
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

                              if (parseFloat(percent) >= 1) {
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
                                return null;
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
                    <h4>Gráfica Anual - PIE - Clientes</h4>
                  </Card.Title>
                  <Card.Subtitle>
                    Numero de Clientes: {clientes.length}
                  </Card.Subtitle>
                  <Card.Text>
                    <div style={{ width: '100%', height: 600 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            dataKey="monto_facturacion"
                            isAnimationActive={true}
                            data={clientes}
                            cx="40%"
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

                              if (parseFloat(percent) >= 1.5) {
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
                                return null;
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
                <h4>Regresión Lineal - Ventas</h4>
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