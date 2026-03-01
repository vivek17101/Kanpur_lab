import { render, screen } from '@testing-library/react';
import App from './App';
import LabProvider from './context/LabContext';

test('renders create report heading by default', () => {
  render(
    <LabProvider>
      <App />
    </LabProvider>
  );

  expect(screen.getByRole('heading', { name: /create report/i })).toBeInTheDocument();
});
