import { render, screen } from '@testing-library/react';
import App from './App';
import LabProvider from './context/LabContext';

test('renders chemical analysis header', () => {
  render(
    <LabProvider>
      <App />
    </LabProvider>
  );
  expect(screen.getByText(/chemical analysis lab/i)).toBeInTheDocument();
});
