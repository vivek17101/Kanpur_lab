import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

export default function Toast({ message, type = "info", onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className={`${styles.toast} ${styles[type]} ${visible ? styles.in : styles.out}`}>
      <span>{message}</span>
      <button className={styles.close} onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 300); }}>✕</button>
    </div>
  );
}
