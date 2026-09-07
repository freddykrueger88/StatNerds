import React, { useMemo, useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLeagueSeason } from '../hooks/useLeagueSeason';
import { getTable, getTableSeason, getAvailableSeasons } from '../services/api';
import ErrorState from '../components/ErrorState';
import LeagueUnavailable from '../components/LeagueUnavailable';
import { leagueLabel, leagueSource } from '../leagues';

const seasonLabel = y => `${y}/${String((y + 1) % 100).padStart(2, '0')}`;

function SeasonChart({ rows }) {
  if (rows.length < 2) {
    return <p style={{ color: '#666', fontSize: '0.8rem' }}>Mindestens zwei Saisons wählen, um den Chart anzuzeigen.</p>;
  }
  const W = 620, H = 190, padL = 34, padR = 26, padT = 18, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const ptsAll = rows.map(r => r.points);
  const posAll = rows.map(r => r.position);
  const pMin = Math.max(0, Math.min(...ptsAll) - 6);
  const pMax = Math.max(...ptsAll) + 6;
  const posMax = Math.max(...posAll) + 2;
  const x = i => padL + (rows.length === 1 ? iw / 2 : (iw * i) / (rows.length - 1));
  const yPts = v => padT + ih - ((v - pMin) / (pMax - pMin)) * ih;
  const yPos = v => padT + ((v - 1) / posMax) * ih;

  const ptsPts = rows.map((r, i) => `${x(i)},${yPts(r.points)}`).join(' ');
  const posPts = rows.map((r, i) => `${x(i)},${yPos(r.position)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role='img' aria-label='Verlauf von Punkten und Tabellenplatz über die Saisons'>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={padL} x2={W - padR} y1={padT + ih * f} y2={padT + ih * f} stroke='#222' strokeWidth='1' />
      ))}
      {rows.map((r, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor='middle' fill='#777' fontSize='9'>{seasonLabel(r.year)}</text>
      ))}
      <polyline points={posPts} fill='none' stroke='#facc15' strokeWidth='2' strokeDasharray='5 3' />
      <polyline points={ptsPts} fill='none' stroke='#4ade80' strokeWidth='2' />
      {rows.map((r, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={yPos(r.position)} r='4' fill='#facc15' />
          <circle cx={x(i)} cy={yPts(r.points)} r='3.5' fill='#4ade80' />
          <text x={x(i) + 6} y={yPos(r.position) - 5} fill='#facc15' fontSize='9'>Platz {r.position}</text>
          <text x={x(i) + 6} y={yPts(r.points) - 5} fill='#4ade80' fontSize='9'>{r.points} Pkt</text>
        </g>
      ))}
    </svg>
  );
}

export default function SeasonCompare({ theme, league }) {
  const season = useLeagueSeason(league);
  const tableFetch  = useFetch(() => getTable(league), null, [league]);
  const table       = Array.isArray(tableFetch.data) ? tableFetch.data : [];
  const names       = useMemo(() => table.map(t => t.teamName || t.shortName).filter(Boolean), [table]);

  const seasonsFetch = useFetch(() => getAvailableSeasons(league), 6 * 60 * 60_000, [league]);
  const allSeasons   = (seasonsFetch.data?.seasons || []).map(String);

  const [club, setClub] = useState(null);
  const [active, setActive] = useState(null);
  const clubName = club || names[0] || '';

  // Standard: die letzten 5 Saisons mit Daten sind aktiv.
  const activeYears = active !== null ? active : allSeasons.slice(0, 5);
  const activeKey   = activeYears.join(',');

  const tablesFetch = useFetch(async () => {
    if (!activeYears.length) return [];
    return Promise.all(activeYears.map(async year => {
      const data = await getTableSeason(league, year);
      return { year, rows: Array.isArray(data) ? data : [] };
    }));
  }, null, [league, activeKey]);

  if (leagueSource(league) !== 'openligadb') return <LeagueUnavailable league={league} />;
  if (tableFetch.loading || seasonsFetch.loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Saison-Daten...</p>;
  if (tableFetch.error || seasonsFetch.error) return <ErrorState message={tableFetch.error || seasonsFetch.error} onRetry={() => { tableFetch.refetch(); seasonsFetch.refetch(); }} icon='📅' />;

  const byYear = {};
  (tablesFetch.data || []).forEach(({ year, rows }) => {
    const idx = rows.findIndex(r => (r.teamName || r.shortName) === clubName);
    if (idx < 0) { byYear[year] = null; return; }
    const r = rows[idx];
    byYear[year] = {
      year,
      position: idx + 1,
      total: rows.length,
      points: r.points,
      played: r.matches,
      won: r.won, draw: r.draw, lost: r.lost,
      goals: r.goals, against: r.opponentGoals, diff: r.goalDiff,
    };
  });

  const chartRows = activeYears.map(y => byYear[y]).filter(Boolean).sort((a, b) => a.year - b.year);

  const chip = y => {
    const on = activeYears.includes(y);
    return (
      <button key={y} onClick={() => {
        const next = on ? activeYears.filter(a => a !== y) : [...activeYears, y].sort((a, b) => Number(b) - Number(a));
        setActive(next);
      }} style={{
        background: on ? theme.primary : 'transparent',
        color: on ? '#fff' : '#999',
        border: `1px solid ${on ? theme.primary : '#333'}`,
        borderRadius: '999px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.75rem',
      }}>
        {seasonLabel(y)}
      </button>
    );
  };

  const select = {
    background: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: '8px',
    padding: '0.4rem 0.6rem', fontSize: '0.85rem', minWidth: '0', flex: 1,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>
          📅 Saisonvergleich – {leagueLabel(league)} <span style={{ fontSize: '0.75rem', color: '#777' }}>(Stand: {season.label})</span>
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.7rem', alignItems: 'center' }}>
        <select value={clubName} disabled={!names.length || tablesFetch.loading} style={select} onChange={e => setClub(e.target.value)}>
          {names.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={() => setActive(allSeasons)} title='Alle Saisons aktivieren'
          style={{ background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Alle</button>
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {allSeasons.map(chip)}
      </div>

      {tablesFetch.loading && <p style={{ color: '#666', fontSize: '0.8rem' }}>⏳ Lade Tabellen...</p>}
      {tablesFetch.error && <ErrorState message={tablesFetch.error} onRetry={tablesFetch.refetch} icon='📊' />}

      {!tablesFetch.loading && chartRows.length > 0 && (
        <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#888' }}>Entwicklung – {clubName}</h3>
          <SeasonChart rows={chartRows} />
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.68rem', color: '#666', marginTop: '0.5rem' }}>
            <span><span style={{ color: '#4ade80' }}>─●</span> Punkte</span>
            <span><span style={{ color: '#facc15' }}>- -●</span> Tabellenplatz (1 = oben)</span>
          </div>
        </div>
      )}

      {!tablesFetch.loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
          {activeYears.map(y => {
            const s = byYear[y];
            return (
              <div key={y} style={{
                background: '#1a1a1a', borderRadius: '14px', padding: '0.7rem 0.8rem', borderLeft: `4px solid ${s ? theme.primary : '#333'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{seasonLabel(y)}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#999' }}>{s ? `#${s.position}` : '–'}</span>
                </div>
                {s ? (
                  <div style={{ fontSize: '0.74rem', color: '#ccc', display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.15rem 0.6rem' }}>
                    <span>Punkte</span><strong>{s.points}</strong>
                    <span>Spiele</span><strong>{s.played}</strong>
                    <span>S / U / N</span><strong>{s.won} / {s.draw} / {s.lost}</strong>
                    <span>Tore</span><strong>{s.goals} : {s.against}</strong>
                    <span>Tordifferenz</span><strong style={{ color: s.diff >= 0 ? '#4ade80' : '#f87171' }}>{s.diff >= 0 ? '+' : ''}{s.diff}</strong>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.72rem', color: '#666', margin: 0 }}>Kein Eintrag – Verein war diese Saison nicht in der Liga.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!tablesFetch.loading && !activeYears.length && (
        <p style={{ color: '#666', fontSize: '0.82rem' }}>Bitte mindestens eine Saison oben auswählen.</p>
      )}
    </div>
  );
}