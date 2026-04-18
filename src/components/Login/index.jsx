import { useState } from "react";
import { loginAdmin } from "../../services/authApi";
import { setStoredToken } from "../../services/apiClient";
import Button, { ButtonLabel } from "../Button";
import styles from "./Login.module.css";

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    username: "admin",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await loginAdmin(credentials);
      setStoredToken(data.token);
      onLogin(data.admin);
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
          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>
          <Button type="submit" disabled={isSubmitting}>
            <ButtonLabel label={isSubmitting ? "Signing in..." : "Login"} />
          </Button>
        </form>
      </div>
    </section>
  );
}
