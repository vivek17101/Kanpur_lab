import { useEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import Header from "./components/Header";
import Login from "./components/Login";
import SampleRegister from "./components/SampleRegister";
import SupplierManager from "./components/SupplierManager";
import Button, { ButtonLabel } from "./components/Button";
import { clearStoredToken, getStoredToken } from "./services/apiClient";
import { getCurrentAdmin, getDatabaseBackup, restoreDatabase } from "./services/authApi";

function App() {
  const [admin, setAdmin] = useState(null);
  const [activePage, setActivePage] = useState("register");
  const [suppliersVersion, setSuppliersVersion] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(getStoredToken()));
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreInputRef = useRef(null);

  useEffect(() => {
    async function restoreSession() {
      if (!getStoredToken()) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const data = await getCurrentAdmin();
        setAdmin(data.admin);
      } catch (error) {
        clearStoredToken();
      } finally {
        setIsCheckingSession(false);
      }
    }

    restoreSession();
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    setAdmin(null);
    setActivePage("register");
  };

  const handleBackupDatabase = async () => {
    if (isBackingUp) {
      return;
    }

    setIsBackingUp(true);

    try {
      const backup = await getDatabaseBackup();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kanpur-lab-backup-${timestamp}.json`;
      link.click();
      URL.revokeObjectURL(url);
      window.alert("Database backup downloaded successfully.");
    } catch (error) {
      window.alert(error.message || "Could not create database backup.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreClick = () => {
    if (isRestoring) {
      return;
    }

    restoreInputRef.current?.click();
  };

  const handleRestoreFileChange = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";

    if (!file || isRestoring) {
      return;
    }

    let backup;

    try {
      const text = await file.text();
      backup = JSON.parse(text);
    } catch (error) {
      window.alert("Selected file is not a valid JSON backup.");
      return;
    }

    const shouldRestore = window.confirm(
      "This will replace the current samples, suppliers, and report counters with the backup file data. Continue?"
    );

    if (!shouldRestore) {
      return;
    }

    setIsRestoring(true);

    try {
      const result = await restoreDatabase(backup);
      window.alert(
        `${result.message}\nSamples: ${result.counts.samples}\nSuppliers: ${result.counts.suppliers}\nCounters: ${result.counts.counters}`
      );
      window.location.reload();
    } catch (error) {
      window.alert(error.message || "Could not restore database backup.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="App">
      <input
        ref={restoreInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={handleRestoreFileChange}
      />
      <Header title="Kanpur Laboratory" />
      <main className="container main" style={{ "--mt": 10, "--mb": 10 }}>
        {isCheckingSession ? (
          <p className={styles.loading}>Checking admin session...</p>
        ) : !admin ? (
          <Login onLogin={setAdmin} />
        ) : (
          <>
            <div className={styles.topbar}>
              <nav className={styles.nav}>
                <button
                  className={activePage === "register" ? styles.active : ""}
                  onClick={() => setActivePage("register")}
                >
                  Sample Register
                </button>
                <button
                  className={activePage === "suppliers" ? styles.active : ""}
                  onClick={() => setActivePage("suppliers")}
                >
                  Supplier Master
                </button>
              </nav>
              <div className={styles.adminBox}>
                <span>Signed in as {admin.username}</span>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={handleBackupDatabase}
                  disabled={isBackingUp || isRestoring}
                >
                  <ButtonLabel label={isBackingUp ? "Backing Up..." : "Backup Database"} />
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={handleRestoreClick}
                  disabled={isRestoring || isBackingUp}
                >
                  <ButtonLabel label={isRestoring ? "Restoring..." : "Restore Backup"} />
                </Button>
                <Button size="md" variant="secondary" onClick={handleLogout}>
                  <ButtonLabel label="Logout" />
                </Button>
              </div>
            </div>

            {activePage === "register" && <SampleRegister suppliersVersion={suppliersVersion} />}
            {activePage === "suppliers" && (
              <SupplierManager onSuppliersChanged={() => setSuppliersVersion((version) => version + 1)} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
