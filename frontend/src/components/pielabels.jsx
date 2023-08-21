const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index, colors }) => {
    const RADIAN = Math.PI / 180;
    const radius = 25 + innerRadius + (outerRadius - innerRadius);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    const percent = ((value / oportunidad.reduce((sum, entry) => sum + entry.monto_facturacion, 0)) * 100).toFixed(2);
  
    return (
      <g>
        <text
          x={x}
          y={y}
          fill="#818282"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
        >
          {`${oportunidad[index].producto} (${percent}%)`}
        </text>
        <line
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke={colors[index % colors.length]}
          strokeWidth={2}
        />
      </g>
    );
  };
  export default CustomPieLabel