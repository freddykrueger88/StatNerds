import { useState, useEffect, useCallback } from 'react';

/**
 * Generischer Fetch-Hook mit Loading/Error-State und optionalem Auto-Refresh.
 *
 * Verwendung:
 *   const { data, loading, error, refetch } = useFetch(() => api.getTable(), 60000);
 *
 * @param {Function} fetcher     - Async-Funktion die die Daten lädt
 * @param {number}   [interval]  - Auto-Refresh-Interval in ms (optional)
 * @param {Array}    [deps]      - Abhängigkeiten für Re-Fetch (wie useEffect deps)
 */
export function useFetch(fetcher, interval = null, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch_();
    if (!interval) return;
    const iv = setInterval(fetch_, interval);
    return () => clearInterval(iv);
  }, [fetch_, interval]);

  return { data, loading, error, refetch: fetch_ };
}
