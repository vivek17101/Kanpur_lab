import { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import Header from './components/Header';
import Login from './components/Login';
import SampleRegister from './components/SampleRegister';
import SupplierManager from './components/SupplierManager';
import ChangePassword from './components/ChangePassword';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import ModernDashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { useAuth } from './contexts/AuthContext';
import { getDatabaseBackup, restoreDatabase } from './services/authApi';

function App() {
  const { admin, isCheckingSession, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [initialRegisterView, setInitialRegisterView] = useState('');
  const [initialRegisterSampleId, setInitialRegisterSampleId] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [suppliersVersion, setSuppliersVersion] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirm, setConfirm] = useState({ message: '', detail: '', onConfirm: null });
  const restoreInputRef = useRef(null);
  const pendingBackupRef = useRef(null);

  const showToast = (message, type = 'info') => setToast({ message, type });
  const dismissConfirm = () => setConfirm({ message: '', detail: '', onConfirm: null });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleNavigate = (page, registerView = '', sampleId = '') => {
    setActivePage(page);
    if (page === 'register') {
      setInitialRegisterView(registerView || '');
      setInitialRegisterSampleId(sampleId || '');
    }
  };

  const handleLogout = () => {
    logout();
    handleNavigate('dashboard');
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
        detail={confirm.detail}
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
            <Navbar
              activePage={activePage}
              admin={admin}
              isBackingUp={isBackingUp}
              isRestoring={isRestoring}
              isDarkMode={isDarkMode}
              onNavigate={handleNavigate}
              onBackup={handleBackupDatabase}
              onRestore={handleRestoreClick}
              onLogout={handleLogout}
              onToggleDarkMode={() => setIsDarkMode((value) => !value)}
            />

            {activePage === 'dashboard' && <ModernDashboard onNavigate={handleNavigate} />}
            {activePage === 'register' && (
              <SampleRegister
                suppliersVersion={suppliersVersion}
                initialView={initialRegisterView}
                initialSampleId={initialRegisterSampleId}
                onInitialViewHandled={() => {
                  setInitialRegisterView('');
                  setInitialRegisterSampleId('');
                }}
              />
            )}
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
