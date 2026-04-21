import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Header from "./components/Header";
import Login from "./components/Login";
import SampleRegister from "./components/SampleRegister";
import SupplierManager from "./components/SupplierManager";
import Button, { ButtonLabel } from "./components/Button";
import { clearStoredToken, getStoredToken } from "./services/apiClient";
import { getCurrentAdmin } from "./services/authApi";

function App() {
  const [admin, setAdmin] = useState(null);
  const [activePage, setActivePage] = useState("register");
  const [suppliersVersion, setSuppliersVersion] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(getStoredToken()));

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

  return (
    <div className="App">
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
