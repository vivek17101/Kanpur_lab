import { render, screen } from '@testing-library/react';
import App from './App';

test('renders chemical analysis header', () => {
  render(<App />);
  expect(screen.getByText(/chemical analysis lab/i)).toBeInTheDocument();
});
