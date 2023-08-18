import React from 'react';
import { Form } from 'react-bootstrap';

const MonthSelector = ({ selectedMonth, onSelectMonth }) => {
  const monthNames = {
    1: 'January',
    2: 'February',
    3: 'March',
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

  return (
    <Form.Group>
      <Form.Label>Select Month:</Form.Label>
      <Form.Control as="select" value={selectedMonth} onChange={(e) => onSelectMonth(e.target.value)}>
        <option value="">Select Month</option>
        {Object.keys(monthNames).map((month) => (
          <option key={month} value={month}>
            {monthNames[month]}
          </option>
        ))}
      </Form.Control>
    </Form.Group>
  );
};

export default MonthSelector;
