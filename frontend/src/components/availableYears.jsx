import { Form } from 'react-bootstrap';
import axios from 'axios';

const YearSelector = ({ selectedYear, onSelectYear, availableYears }) => {
  const handleYearChange = async (event) => {
    const newSelectedYear = event.target.value;
    onSelectYear(newSelectedYear);
    
    try {
      const response = await axios.post('http://localhost:8000/update_highest_id?selected_year='+newSelectedYear);
    } catch (error) {
      console.error('Error updating highest_id:', error);
    }
  };

  return (
    <>
      {availableYears.length > 0 && (
        <Form>
          <Form.Group controlId="yearSelect">
            <Form.Label>Select Year:</Form.Label>
            <Form.Control as="select" value={selectedYear} onChange={handleYearChange}>
              <option value="">Select a year</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Form>
      )}
    </>

  );
};

export default YearSelector