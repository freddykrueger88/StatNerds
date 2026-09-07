import { useFetch } from './useFetch';
import { getLeagueSeasons } from '../services/api';
import { seasonLabel, seasonFile } from '../leagues';

// Modul-Cache: /api/meta/seasons nur einmal (parallel abgesichert) laden
let sharedPromise = null;

function load() {
  if (!sharedPromise) {
    sharedPromise = getLeagueSeasons().then(d => d, e => null).finally(() => { sharedPromise = null; });
  }
  return sharedPromise;
}

// Liefert die vom Backend tatsächlich verwendete Saison einer Liga
// („loading" solange noch unbekannt; Fallback auf aktuelles Jahr).
export function useLeagueSeason(league) {
  const { data } = useFetch(load, null, []);
  const info = (data || null)?.[league];
  return {
    loading: !data,
    label:    info?.label   || seasonLabel(),
    fileName: info?.label ? `${info.year}-${info.year + 1}` : seasonFile(),
    isCurrent: info?.isCurrent !== false,
  };
}