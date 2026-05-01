import React from "react";
import logo from "../../assets/kanpur_lab_logo.png";
import styles from "./Header.module.css";
export default function Header({ title }) {
  return (
    <header className={styles.header} id="header">
      <div className={`container ${styles.inner}`}>
        <img src={logo} alt="Kanpur Laboratory" className={styles.logo} />
        <h1>{title}</h1>
      </div>
    </header>
  );
}
