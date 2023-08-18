import { Form } from 'react-bootstrap';

const YearSelector = ({ selectedYear, onSelectYear, availableYears }) => {
  return (
    <Form.Group>
      <Form.Label>Select Year:</Form.Label>
      <Form.Control as="select" value={selectedYear} onChange={(e) => onSelectYear(e.target.value)}>
        <option value="">All Years</option>
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Form.Control>
    </Form.Group>
  );
};

export default YearSelector