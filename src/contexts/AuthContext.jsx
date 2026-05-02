import { createContext, useContext, useEffect, useState } from 'react';
import { clearStoredToken, getStoredToken } from '../services/apiClient';
import { getCurrentAdmin } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
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
        console.error('Session restore failed:', error);
        clearStoredToken();
      } finally {
        setIsCheckingSession(false);
      }
    }

    restoreSession();
  }, []);

  const logout = () => {
    clearStoredToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, setAdmin, isCheckingSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
