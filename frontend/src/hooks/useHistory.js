import { useLocalStorage } from './useLocalStorage';

const MAX = 10;

export function useHistory() {
  const [history, setHistory] = useLocalStorage('sn_history', []);

  function push(type, id, label, meta) {
    if (!type || !id) return;
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.type === type && h.id === String(id)));
      const entry = { type, id: String(id), label: label || id, ts: Date.now(), ...(meta || {}) };
      return [entry, ...filtered].slice(0, MAX);
    });
  }

  function clear() {
    setHistory([]);
  }

  return { history, push, clear };
}