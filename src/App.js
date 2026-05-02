import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import Header from './components/Header';
import Login from './components/Login';
import SampleRegister from './components/SampleRegister';
import SupplierManager from './components/SupplierManager';
import ChangePassword from './components/ChangePassword';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import Button, { ButtonLabel } from './components/Button';
import { useAuth } from './contexts/AuthContext';
import { getDatabaseBackup, restoreDatabase } from './services/authApi';
import { getSamples, getSampleStats } from './services/sampleApi';
import { getSuppliers } from './services/supplierApi';

function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({ total: 0, Pending: 0, Tested: 0, Reported: 0 });
  const [recentSamples, setRecentSamples] = useState([]);
  const [supplierCount, setSupplierCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summary, latest, suppliers] = await Promise.all([
        getSampleStats(),
        getSamples({ page: 1, limit: 6 }),
        getSuppliers(),
      ]);
      setStats(summary);
      setRecentSamples(latest.samples || []);
      setSupplierCount(suppliers.length);
    } catch {
      setRecentSamples([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const attentionCount = Number(stats.Pending || 0) + Number(stats.Tested || 0);

  return (
    <section className={styles.dashboard}>
      <div className={styles.dashboardHero}>
        <div>
          <span className={styles.eyebrow}>Lab operations</span>
          <h2>Today’s workbench</h2>
          <p>Track incoming samples, pending results, and reports ready to send.</p>
        </div>
        <div className={styles.heroActions}>
          <Button onClick={() => onNavigate('register')}>
            <ButtonLabel label="Open Register" />
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('suppliers')}>
            <ButtonLabel label="Supplier Master" />
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <article>
          <span>Total samples</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Need attention</span>
          <strong>{attentionCount}</strong>
        </article>
        <article>
          <span>Reports sent</span>
          <strong>{stats.Reported}</strong>
        </article>
        <article>
          <span>Suppliers</span>
          <strong>{supplierCount}</strong>
        </article>
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.workPanel}>
          <div className={styles.panelTitle}>
            <h3>Workflow</h3>
            <span>{isLoading ? 'Refreshing...' : `${stats.total || 0} records`}</span>
          </div>
          <div className={styles.flowList}>
            <button onClick={() => onNavigate('register')}>
              <span className={styles.flowDotPending} />
              <strong>{stats.Pending}</strong>
              <span>Pending test entry</span>
            </button>
            <button onClick={() => onNavigate('register')}>
              <span className={styles.flowDotTested} />
              <strong>{stats.Tested}</strong>
              <span>Reports ready</span>
            </button>
            <button onClick={() => onNavigate('register')}>
              <span className={styles.flowDotReported} />
              <strong>{stats.Reported}</strong>
              <span>Reported samples</span>
            </button>
          </div>
        </section>

        <section className={styles.workPanel}>
          <div className={styles.panelTitle}>
            <h3>Recent samples</h3>
            <button onClick={() => onNavigate('register')}>View all</button>
          </div>
          <div className={styles.recentList}>
            {recentSamples.length === 0 ? (
              <p>No recent samples found.</p>
            ) : (
              recentSamples.map((sample) => (
                <div key={sample._id} className={styles.recentItem}>
                  <div>
                    <strong>{sample.reportNumber || sample.sampleNo || 'New sample'}</strong>
                    <span>{sample.supplierName} / {sample.sampleReference}</span>
                  </div>
                  <span className={`${styles.statusPill} ${styles[`status${sample.status}`]}`}>
                    {sample.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function App() {
  const { admin, isCheckingSession, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [suppliersVersion, setSuppliersVersion] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirm, setConfirm] = useState({ message: '', detail: '', onConfirm: null });
  const restoreInputRef = useRef(null);
  const pendingBackupRef = useRef(null);

  const showToast = (message, type = 'info') => setToast({ message, type });
  const dismissConfirm = () => setConfirm({ message: '', detail: '', onConfirm: null });

  const handleLogout = () => {
    logout();
    setActivePage('dashboard');
  };

  const handleBackupDatabase = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    try {
      const backup = await getDatabaseBackup();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kanpur-lab-backup-${timestamp}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Database backup downloaded.', 'success');
    } catch (error) {
      console.error('Backup failed:', error);
      showToast(error.message || 'Could not create database backup.', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreClick = () => {
    if (!isRestoring) restoreInputRef.current?.click();
  };

  const handleRestoreFileChange = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (!file || isRestoring) return;

    let backup;
    try {
      backup = JSON.parse(await file.text());
    } catch (error) {
      console.error('Restore parse failed:', error);
      showToast('Selected file is not a valid JSON backup.', 'error');
      return;
    }

    pendingBackupRef.current = backup;
    const counts = backup?.counts || backup?.data || {};
    const sampleCount = counts.samples?.length ?? counts.samples ?? 0;
    const supplierCount = counts.suppliers?.length ?? counts.suppliers ?? 0;
    setConfirm({
      message: 'Restore this backup?',
      detail:
        `This will replace current data with ${sampleCount} samples and ${supplierCount} suppliers. Create a fresh backup first if you need a rollback point.`,
      onConfirm: async () => {
        dismissConfirm();
        setIsRestoring(true);
        try {
          const result = await restoreDatabase(pendingBackupRef.current);
          showToast(
            `Restored ${result.counts.samples} samples and ${result.counts.suppliers} suppliers.`,
            'success'
          );
          setTimeout(() => window.location.reload(), 1800);
        } catch (error) {
          console.error('Restore failed:', error);
          showToast(error.message || 'Could not restore backup.', 'error');
        } finally {
          setIsRestoring(false);
          pendingBackupRef.current = null;
        }
      },
    });
  };

  return (
    <div className="App">
      <Toast
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ message: '', type: 'info' })}
      />
      <ConfirmModal
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={dismissConfirm}
        confirmLabel="Restore"
        variant="primary"
      />
      <input
        ref={restoreInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleRestoreFileChange}
      />
      <Header title="Kanpur Laboratory" />
      <main className="container main" style={{ '--mt': 10, '--mb': 10 }}>
        {isCheckingSession ? (
          <p className={styles.loading}>Checking admin session...</p>
        ) : !admin ? (
          <Login />
        ) : (
          <>
            <div className={styles.topbar}>
              <nav className={styles.nav}>
                <button
                  className={activePage === 'dashboard' ? styles.active : ''}
                  onClick={() => setActivePage('dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={activePage === 'register' ? styles.active : ''}
                  onClick={() => setActivePage('register')}
                >
                  Sample Register
                </button>
                <button
                  className={activePage === 'suppliers' ? styles.active : ''}
                  onClick={() => setActivePage('suppliers')}
                >
                  Supplier Master
                </button>
                <button
                  className={activePage === 'password' ? styles.active : ''}
                  onClick={() => setActivePage('password')}
                >
                  Change Password
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
                  <ButtonLabel label={isBackingUp ? 'Backing Up...' : 'Backup Database'} />
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={handleRestoreClick}
                  disabled={isRestoring || isBackingUp}
                >
                  <ButtonLabel label={isRestoring ? 'Restoring...' : 'Restore Backup'} />
                </Button>
                <Button size="md" variant="secondary" onClick={handleLogout}>
                  <ButtonLabel label="Logout" />
                </Button>
              </div>
            </div>

            {activePage === 'dashboard' && <Dashboard onNavigate={setActivePage} />}
            {activePage === 'register' && <SampleRegister suppliersVersion={suppliersVersion} />}
            {activePage === 'suppliers' && (
              <SupplierManager onSuppliersChanged={() => setSuppliersVersion((v) => v + 1)} />
            )}
            {activePage === 'password' && <ChangePassword />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
