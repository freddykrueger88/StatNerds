import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generischer Fetch-Hook mit Loading/Error/lastUpdate-State und optionalem Auto-Refresh.
 *
 * @param {Function} fetcher     - Async-Funktion die die Daten lädt
 * @param {number}   [interval]  - Auto-Refresh-Interval in ms (null = kein Auto-Refresh)
 * @param {Array}    [deps]      - Abhängigkeiten für Re-Fetch (wie useEffect deps)
 *
 * @returns {{ data, loading, error, refetch, lastUpdate }}
 */
export function useFetch(fetcher, interval = null, deps = []) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      if (!mountedRef.current) return;
      setData(result);
      setLastUpdate(Date.now());
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch_();
    if (!interval) return;
    const iv = setInterval(fetch_, interval);
    return () => clearInterval(iv);
  }, [fetch_, interval]);

  return { data, loading, error, refetch: fetch_, lastUpdate };
}
