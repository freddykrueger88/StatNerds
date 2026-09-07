import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { authRegister, authLogin, authMe, authSync } from '../services/api';

/**
 * Benutzerkonto (Issue #15): optionaler Guest-Mode.
 * Token + E-Mail in localStorage; ohne Token bleibt die App im Guest-Mode.
 */
export function useAuth() {
  const [token, setToken] = useLocalStorage('sn_token', '');
  const [email, setEmail] = useLocalStorage('sn_email', '');
  const [busy, setBusy] = useState(false);

  const applySettings = useCallback((settings, setters) => {
    Object.entries(settings || {}).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      const setter = setters[key];
      if (setter && typeof setter === 'function') setter(value);
    });
  }, []);

  const login = useCallback(async (loginEmail, password, localSettings, setters) => {
    setBusy(true);
    try {
      const data = await authLogin(loginEmail, password, localSettings);
      setToken(data.token);
      setEmail(data.user.email);
      applySettings(data.settings, setters);
      return { ok: true, message: 'Eingeloggt! Einstellungen synchronisiert.' };
    } catch (e) {
      return { ok: false, message: e.message || 'Login fehlgeschlagen' };
    } finally {
      setBusy(false);
    }
  }, [setToken, setEmail, applySettings]);

  const register = useCallback(async (regEmail, password, localSettings, setters) => {
    setBusy(true);
    try {
      const data = await authRegister(regEmail, password, localSettings);
      setToken(data.token);
      setEmail(data.user.email);
      applySettings(data.settings, setters);
      return { ok: true, message: 'Konto erstellt! Einstellungen synchronisiert.' };
    } catch (e) {
      return { ok: false, message: e.message || 'Registrierung fehlgeschlagen' };
    } finally {
      setBusy(false);
    }
  }, [setToken, setEmail, applySettings]);

  const logout = useCallback(() => {
    setToken('');
    setEmail('');
  }, [setToken, setEmail]);

  const syncToServer = useCallback(async (localSettings) => {
    if (!token) return { ok: false, message: 'Nicht eingeloggt.' };
    try {
      await authSync(token, localSettings);
      return { ok: true, message: 'Auf den Server übertragen.' };
    } catch (e) {
      return { ok: false, message: e.message || 'Sync fehlgeschlagen' };
    }
  }, [token]);

  const syncFromServer = useCallback(async (setters) => {
    if (!token) return { ok: false, message: 'Nicht eingeloggt.' };
    try {
      const data = await authMe(token);
      applySettings(data.settings, setters);
      return { ok: true, message: 'Vom Server geladen.' };
    } catch (e) {
      return { ok: false, message: e.message || 'Sync fehlgeschlagen' };
    }
  }, [token, applySettings]);

  return {
    token,
    email,
    loggedIn: !!token,
    busy,
    login,
    register,
    logout,
    syncToServer,
    syncFromServer,
  };
}
