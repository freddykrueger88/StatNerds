import { useState } from 'react';

/**
 * useState-Wrapper mit automatischer localStorage-Persistierung.
 * Verwendung: const [wert, setWert] = useLocalStorage('mein-key', standardwert);
 */
export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function setValue(value) {
    try {
      const toStore = value instanceof Function ? value(stored) : value;
      setStored(toStore);
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch (e) {
      console.warn(`useLocalStorage: Fehler beim Speichern von "${key}"`, e);
    }
  }

  function removeValue() {
    try {
      localStorage.removeItem(key);
      setStored(initialValue);
    } catch {}
  }

  return [stored, setValue, removeValue];
}
