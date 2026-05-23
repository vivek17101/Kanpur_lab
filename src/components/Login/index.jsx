import { useState } from 'react';
import { loginAdmin } from '../../services/authApi';
import { setStoredToken } from '../../services/apiClient';
import Button, { ButtonLabel } from '../Button';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Login.module.css';

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
          autoComplete={autoComplete}
          required
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

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  };

  const { setAdmin } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await loginAdmin(credentials);
      setStoredToken(data.token);
      setAdmin(data.admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.screen}>
      <div className={styles.card}>
        <h2>Admin Login</h2>
        <p>Sign in to manage samples, reports, and supplier WhatsApp details.</p>
        {error && <p className={styles.error}>{error}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Username</span>
            <input
              name="username"
              value={credentials.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </label>
          <PasswordField
            label="Password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
          <Button type="submit" disabled={isSubmitting}>
            <ButtonLabel label={isSubmitting ? 'Signing in...' : 'Login'} />
          </Button>
        </form>
      </div>
    </section>
  );
}
