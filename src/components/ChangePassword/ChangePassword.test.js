import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChangePassword from './components/ChangePassword';

describe('ChangePassword Component', () => {
  test('renders form fields', () => {
    render(<ChangePassword />);
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
  });

  test('shows error for mismatched passwords', async () => {
    render(<ChangePassword />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
    await screen.findByText('New passwords do not match.');
  });
});
