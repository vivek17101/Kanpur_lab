import { useRef, useState } from 'react';
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

function App() {
  const { admin, isCheckingSession, logout } = useAuth();
  const [activePage, setActivePage] = useState('register');
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
    setActivePage('register');
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
    setConfirm({
      message: 'Restore this backup?',
      detail:
        'This will replace all current samples, suppliers, and report counters. This cannot be undone.',
      onConfirm: async () => {
        dismissConfirm();
        setIsRestoring(true);
        try {
          const result = await restoreDatabase(pendingBackupRef.current);
          showToast(
            `Restored � ${result.counts.samples} samples, ${result.counts.suppliers} suppliers.`,
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
