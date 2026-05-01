import { useState } from "react";
import { changePassword } from "../../services/authApi";
import Button, { ButtonLabel } from "../Button";
import Toast from "../Toast";
import styles from "./ChangePassword.module.css";

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [toast, setToast] = useState({ message: "", type: "info" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setToast({ message: "New passwords do not match.", type: "error" });
      return;
    }
    if (form.newPassword.length < 8) {
      setToast({ message: "New password must be at least 8 characters.", type: "error" });
      return;
    }
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setToast({ message: "Password changed successfully.", type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  return (
    <div className={styles.shell}>
      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: "", type: "info" })} />
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className="text--lg fw-700">Change Password</h2>
            <p className={styles.muted}>Update the admin login password.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span>Current Password</span>
            <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} required autoComplete="current-password" />
          </label>
          <label className={styles.field}>
            <span>New Password</span>
            <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required autoComplete="new-password" minLength={8} />
          </label>
          <label className={styles.field}>
            <span>Confirm New Password</span>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" minLength={8} />
          </label>
          <div className={styles.actions}>
            <Button type="submit"><ButtonLabel label="Change Password" /></Button>
          </div>
        </form>
      </section>
    </div>
  );
}
