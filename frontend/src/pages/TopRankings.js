import React, { useMemo, useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getScorers, getAssists, getAvailableSeasons, getApiFootballPlayerSearch } from '../services/api';
import ErrorState from '../components/ErrorState';
import { PlayerDetail, APIF } from '../components/squad';
import { leagueLabel } from '../leagues';

const FOO_LIGAS = [
  { id: 'bl1',  label: '1. Bundesliga' },
  { id: 'bl2',  label: '2. Bundesliga' },
  { id: 'fbl1', label: 'Frauen-Bundesliga' },
];

const CATS = [
  { id: 'goals',   label: '⚽ Tore' },
  { id: 'assists', label: '🤝 Vorlagen' },
  { id: 'combined', label: '🧮 Tore + Vorlagen' },
];

const PER_PAGE = 15;

function PageButtons({ total, page, setPage, theme }) {
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(page, pages);
  const maxBtns = 5;
  let start = Math.max(1, current - Math.floor(maxBtns / 2));
  let end = Math.min(pages, start + maxBtns - 1);
  if (end - start < maxBtns - 1) start = Math.max(1, end - maxBtns + 1);
  return pages > 1 ? (
    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
      <button onClick={() => setPage(current - 1)} disabled={current <= 1} aria-label='Vorherige Seite' style={{
        background: 'transparent', color: current <= 1 ? '#333' : '#ddd', border: '1px solid #333',
        borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: current <= 1 ? 'default' : 'pointer', fontSize: '0.8rem',
      }}>‹</button>
      {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
        <button key={p} onClick={() => setPage(p)} aria-label={`Seite ${p}`} aria-current={p === current ? 'page' : undefined} style={{
          background: p === current ? theme.primary : 'transparent', color: p === current ? '#fff' : '#888',
          border: `1px solid ${p === current ? theme.primary : '#333'}`, borderRadius: '6px',
          padding: '0.3rem 0.6rem', cursor: 'pointer', fontWeight: p === current ? 'bold' : 'normal', fontSize: '0.8rem',
        }}>{p}</button>
      ))}
      <button onClick={() => setPage(current + 1)} disabled={current >= pages} aria-label='Nächste Seite' style={{
        background: 'transparent', color: current >= pages ? '#333' : '#ddd', border: '1px solid #333',
        borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: current >= pages ? 'default' : 'pointer', fontSize: '0.8rem',
      }}>›</button>
    </div>
  ) : null;
}

export default function TopRankings({ theme }) {
  const [cat, setCat] = useState('goals');
  const [ligas, setLigas] = useState(() => FOO_LIGAS.map(l => l.id));
  const [season, setSeason] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchResult, setSearchResult] = useState(null);

  const [apiKey] = useLocalStorage('sn_key_api_football', '');
  const useApi = !!apiKey;

  const activeLigas = ligas.length ? ligas : FOO_LIGAS.map(l => l.id);

  const seasonsFetch = useFetch(() => getAvailableSeasons('bl1'), 6 * 60 * 60 * 1000, []);
  const seasonOptions = Array.isArray(seasonsFetch?.data?.seasons) ? seasonsFetch.data.seasons : [];

  const goalFlags = activeLigas.map(lg => `${cat === 'goals' || cat === 'combined'}|${season}|${lg}`);
  const assistFlags = activeLigas.map(lg => `${cat === 'assists' || cat === 'combined'}|${season}|${lg}`);

  const gBl1 = useFetch(() => getScorers('bl1', season), 15 * 60 * 1000, goalFlags.find(f => f.endsWith('|bl1')) || 'off|bl1');
  const gBl2 = useFetch(() => getScorers('bl2', season), 15 * 60 * 1000, goalFlags.find(f => f.endsWith('|bl2')) || 'off|bl2');
  const gFbl = useFetch(() => getScorers('fbl1', season), 15 * 60 * 1000, goalFlags.find(f => f.endsWith('|fbl1')) || 'off|fbl1');
  const aBl1 = useFetch(() => getAssists('bl1', season), 15 * 60 * 1000, assistFlags.find(f => f.endsWith('|bl1')) || 'off|bl1');
  const aBl2 = useFetch(() => getAssists('bl2', season), 15 * 60 * 1000, assistFlags.find(f => f.endsWith('|bl2')) || 'off|bl2');
  const aFbl = useFetch(() => getAssists('fbl1', season), 15 * 60 * 1000, assistFlags.find(f => f.endsWith('|fbl1')) || 'off|fbl1');

  const FETCHES = { bl1: { g: gBl1, a: aBl1 }, bl2: { g: gBl2, a: aBl2 }, fbl1: { g: gFbl, a: aFbl } };

  const loading = activeLigas.some(lg => FETCHES[lg].g.loading || FETCHES[lg].a.loading);
  const errorEntry = activeLigas.map(lg => FETCHES[lg].g || FETCHES[lg].a).find(x => x.error);
  const error = errorEntry ? errorEntry.error : null;
  const refetch = () => activeLigas.forEach(lg => { FETCHES[lg].g.refetch(); FETCHES[lg].a.refetch(); });

  const perLiga = activeLigas.map(lg => ({ lg, goals: FETCHES[lg].g, assists: FETCHES[lg].a }));

  const rows = useMemo(() => {
    const map = {};
    for (const { lg, goals, assists } of perLiga) {
      const gList = Array.isArray(goals.data) ? goals.data : [];
      const aList = Array.isArray(assists.data) ? assists.data : [];
      const push = (key, name, team, increment) => {
        const k = `${name}|${team}`;
        if (!map[k]) map[k] = { name, team, league: lg, goals: 0, assists: 0 };
        map[k][key] += increment;
      };
      gList.forEach(s => push('goals', s.name, s.team, s.goals || 0));
      aList.forEach(s => push('assists', s.name, s.team, s.assists || 0));
    }
    const all = Object.values(map);
    if (cat === 'goals') all.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
    else if (cat === 'assists') all.sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name));
    else all.sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists) || a.name.localeCompare(b.name));
    return all;
  }, [perLiga, cat]);

  const valueKey = cat === 'goals' ? 'goals' : cat === 'assists' ? 'assists' : null;
  const valueOf = r => valueKey ? r[valueKey] : (r.goals + r.assists);
  const valueLabel = CATS.find(c => c.id === cat)?.label.replace(/^[^ ]+ /, '') || '';

  if (selectedPlayer && !selectedPlayer.searching) {
    return (
      <PlayerDetail player={selectedPlayer} theme={theme} apiKey={apiKey} aph={APIF.bl1}
        onBack={() => { setSelectedPlayer(null); setSearchResult(null); }} />
    );
  }
  if (selectedPlayer && selectedPlayer.searching) {
    return (
      <div>
        <button onClick={() => { setSelectedPlayer(null); setSearchResult(null); }} style={{ background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`, borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}>← Zurück</button>
        <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>⏳ Suche Spielerprofil...</p>
      </div>
    );
  }
  if (searchResult) {
    const msg = searchResult === 'notfound'
      ? 'Kein Spielerprofil zu diesem Namen gefunden.'
      : 'Spielerprofil konnte nicht geladen werden.';
    return (
      <div>
        <button onClick={() => { setSelectedPlayer(null); setSearchResult(null); }} style={{ background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`, borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}>← Zurück</button>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🙍‍♂️</div>
          <p style={{ color: '#555' }}>{msg}</p>
        </div>
      </div>
    );
  }

  const openPlayer = async name => {
    if (!useApi) return;
    setSelectedPlayer({ name, searching: true });
    try {
      const res = await getApiFootballPlayerSearch(name, APIF.bl1.league, apiKey, APIF.bl1.leagueId);
      const list = Array.isArray(res) ? res : [];
      const exact = list.find(p => (p.name || '').toLowerCase() === name.toLowerCase()) || list[0];
      if (exact) setSelectedPlayer({ ...exact });
      else setSearchResult('notfound');
    } catch (e) { setSearchResult('error'); }
  };

  const paginated = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.1rem' }}>🏅 Spieler-Ranglisten ligaübergreifend</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={season || ''} onChange={e => { setSeason(e.target.value ? Number(e.target.value) : null); setPage(1); }} aria-label='Saison wählen' style={{
            background: '#1a1a1a', color: '#ddd', border: '1px solid #333', borderRadius: '8px', padding: '0.4rem 0.5rem', fontSize: '0.8rem',
          }}>
            {seasonOptions.length ? <>
              <option value=''>Aktuelle Saison</option>
              {seasonOptions.map(y => <option key={y} value={y}>{y}/{String((y + 1) % 100).padStart(2, '0')}</option>)}
            </> : null}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {CATS.map(t => (
          <button key={t.id} onClick={() => { setCat(t.id); setPage(1); }} style={{
            background: cat === t.id ? theme.primary : 'transparent',
            color: cat === t.id ? '#fff' : '#555',
            border: `1px solid ${cat === t.id ? theme.primary : '#333'}`,
            borderRadius: '6px', padding: '0.35rem 1rem', cursor: 'pointer',
            fontWeight: cat === t.id ? 'bold' : 'normal', fontSize: '0.85rem', transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>Ligen:</span>
        {FOO_LIGAS.map(l => {
          const on = ligas.includes(l.id);
          return (
            <button key={l.id} onClick={() => {
              const next = on ? ligas.filter(x => x !== l.id) : [...ligas, l.id];
              setLigas(next.length ? next : []);
              setPage(1);
            }} style={{
              background: on ? theme.primary : 'transparent', color: on ? '#fff' : '#888',
              border: `1px solid ${on ? theme.primary : '#333'}`, borderRadius: '20px', padding: '0.25rem 0.9rem',
              cursor: 'pointer', fontWeight: on ? 'bold' : 'normal', fontSize: '0.8rem', marginRight: '0.4rem',
              transition: 'all 0.15s',
            }}>{l.label}</button>
          );
        })}
      </div>

      {useApi && <p style={{ fontSize: '0.72rem', color: '#444', margin: '-0.6rem 0 0.8rem' }}>
        💡 Mit einem API-Football-Key sind die Spielernamen klickbar und öffnen das Spielerprofil.
      </p>}

{loading ? <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>⏳ Lade Ranglisten...</p>
        : error ? <ErrorState message={error} onRetry={refetch} icon='🏅' />
        : !rows.length ? (
        <div>
          <p style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>Keine Daten für diese Auswahl.</p>
          {cat !== 'goals' && (
            <p style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center', maxWidth: '34rem', margin: '0.4rem auto 0' }}>
              ⚠️ Die Datenquelle (OpenLigaDB) liefert für diese Kategorie häufig keine Werte – für die Tore-Rangliste
              sind die Daten üblicherweise vollständig.
            </p>
          )}
        </div>
        ) : (
        <div style={{ background: '#16161e', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '0.55rem 0.8rem', color: '#555', fontSize: '0.72rem', fontWeight: 'bold', borderBottom: '1px solid #222' }}>
            <span style={{ width: '2.5rem' }}>#</span>
            <span style={{ flex: 1 }}>Spieler</span>
            <span style={{ width: '9rem' }}>Verein</span>
            <span style={{ width: '8rem' }}>Liga</span>
            <span style={{ width: '3rem', textAlign: 'right' }}>{valueLabel}</span>
          </div>
          {paginated.map((r, i) => {
            const globalRank = (page - 1) * PER_PAGE + i + 1;
            return (
              <div key={`${r.league}-${r.name}-${r.team}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', borderBottom: '1px solid #1f1f28' }}>
                <span style={{ width: '2.5rem', fontWeight: 'bold', color: globalRank <= 3 ? theme.primary : '#666' }}>
                  {globalRank <= 3 ? ['🥇', '🥈', '🥉'][globalRank - 1] : globalRank}
                </span>
                <span style={{ flex: 1, fontSize: '0.85rem' }}>
                  {useApi
                    ? <button onClick={() => openPlayer(r.name)} title='Spielerprofil öffnen' style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontSize: 'inherit', textAlign: 'left' }}>{r.name}</button>
                    : r.name}
                </span>
                <span style={{ width: '9rem', fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.team}</span>
                <span style={{ width: '8rem', fontSize: '0.72rem', color: '#555' }}>{leagueLabel(r.league)}</span>
                <strong style={{ width: '3rem', textAlign: 'right', color: theme.primary }}>{valueOf(r)}</strong>
              </div>
            );
          })}
        </div>
      )}

      <PageButtons total={rows.length} page={page} setPage={setPage} theme={theme} />
    </div>
  );
}
