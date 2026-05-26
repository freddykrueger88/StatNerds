import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generischer Fetch-Hook mit Loading/Error/Refreshing-State und optionalem Auto-Refresh.
 *
 * - Beim ersten Laden: loading=true  (Skeleton anzeigen)
 * - Beim Auto-Refresh: refreshing=true, loading bleibt false (kein Flackern)
 *
 * @param {Function} fetcher     - Async-Funktion die die Daten lädt
 * @param {number}   [interval]  - Auto-Refresh-Interval in ms (null = kein Auto-Refresh)
 * @param {Array}    [deps]      - Abhängigkeiten für Re-Fetch (wie useEffect deps)
 *
 * @returns {{ data, loading, refreshing, error, refetch, lastUpdate }}
 */
export function useFetch(fetcher, interval = null, deps = []) {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);   // nur erstes Laden
  const [refreshing,  setRefreshing]  = useState(false);  // Auto-Refresh im Hintergrund
  const [error,       setError]       = useState(null);
  const [lastUpdate,  setLastUpdate]  = useState(null);
  const mountedRef  = useRef(true);
  const hasDataRef  = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetch_ = useCallback(async () => {
    if (!mountedRef.current) return;
    if (hasDataRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await fetcher();
      if (!mountedRef.current) return;
      setData(result);
      setLastUpdate(Date.now());
      hasDataRef.current = true;
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e.message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch_();
    if (!interval) return;
    const iv = setInterval(fetch_, interval);
    return () => clearInterval(iv);
  }, [fetch_, interval]);

  return { data, loading, refreshing, error, refetch: fetch_, lastUpdate };
}
