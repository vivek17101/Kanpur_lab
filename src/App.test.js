import { render, screen } from '@testing-library/react';
import App from './App';

test('renders kanpur laboratory header', () => {
  render(<App />);
  expect(screen.getByText(/kanpur laboratory/i)).toBeInTheDocument();
});
