import { useState } from 'react';
import { changePassword } from '../../services/authApi';
import Button, { ButtonLabel } from '../Button';
import Toast from '../Toast';
import styles from './ChangePassword.module.css';

function EyeIcon({ open }) {
  return open ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordField({ label, name, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div className={styles.inputWrapper}>
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
          minLength={name !== 'currentPassword' ? 8 : undefined}
        />
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </label>
  );
}

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setToast({ message: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (form.newPassword.length < 8) {
      setToast({ message: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setToast({ message: 'Password changed successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className={styles.shell}>
      <Toast
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ message: '', type: 'info' })}
      />
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className="text--lg fw-700">Change Password</h2>
            <p className={styles.muted}>Update the admin login password.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <PasswordField
            label="Current Password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
          />
          <PasswordField
            label="New Password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm New Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
          <div className={styles.actions}>
            <Button type="submit">
              <ButtonLabel label="Change Password" />
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
