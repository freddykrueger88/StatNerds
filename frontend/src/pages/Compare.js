import React, { useMemo, useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLeagueSeason } from '../hooks/useLeagueSeason';
import { getTable, getCompare, getTeamForm } from '../services/api';
import ErrorState from '../components/ErrorState';
import LeagueUnavailable from '../components/LeagueUnavailable';
import FormChart from '../components/FormChart';
import { leagueLabel, leagueSource } from '../leagues';

const fDate = iso => {
  try { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return ''; }
};

const FORM_COLORS = { S: '#4ade80', U: '#facc15', N: '#f87171' };

function StatRow({ label, a, b, theme, strong }) {
  const winner = a === b ? null : (a > b ? 'left' : 'right');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto 1fr', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.2rem', borderBottom: '1px solid #1f1f1f' }}>
      <span style={{
        textAlign: 'right', fontWeight: strong || winner === 'left' ? 'bold' : 'normal',
        color: winner === 'left' ? theme.primary : '#fff', fontSize: '0.92rem',
      }}>{a}</span>
      <span style={{ color: '#666', fontSize: '0.7rem', textAlign: 'center' }}>{label}</span>
      {/* Spacer-Dummy hält Grid symmetrisch */}
      <span style={{ display: 'none' }} />
      <span />
      <span style={{
        textAlign: 'left', fontWeight: strong || winner === 'right' ? 'bold' : 'normal',
        color: winner === 'right' ? theme.primary : '#fff', fontSize: '0.92rem',
      }}>{b}</span>
    </div>
  );
}

export default function Compare({ theme, league }) {
  const season = useLeagueSeason(league);
  const tableFetch = useFetch(() => getTable(league), null, [league]);
  const table = Array.isArray(tableFetch.data) ? tableFetch.data : [];

  const names = useMemo(() => table.map(t => t.teamName || t.name).filter(Boolean), [table]);
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);

  const t1 = team1 || names[0] || '';
  const t2 = team2 || names[1] || '';

  const compareFetch = useFetch(() => getCompare(t1, t2, league), null, [t1, t2, league]);
  const d = compareFetch.data;

  const formFetch = useFetch(
    () => Promise.all([getTeamForm(t1, league), getTeamForm(t2, league)]).then(([f1, f2]) => ({ team1: f1, team2: f2 })),
    null, [t1, t2, league]
  );

  if (leagueSource(league) !== 'openligadb') return <LeagueUnavailable league={league} />;

  if (tableFetch.loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Vereine...</p>;
  if (tableFetch.error)   return <ErrorState message={tableFetch.error} onRetry={tableFetch.refetch} icon='⚖️' />;

  const select = {
    background: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: '8px',
    padding: '0.4rem 0.6rem', fontSize: '0.85rem', minWidth: '0', flex: 1,
  };

  const formRow = (form, align) => (
    <span style={{ display: 'flex', gap: '0.18rem', justifyContent: align, flexWrap: 'wrap' }}>
      {(form || '').split('·').filter(Boolean).map((c, i) => (
        <span key={i} style={{
          background: FORM_COLORS[c] || '#333', color: '#000', width: '16px', height: '16px',
          borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.58rem', fontWeight: 'bold',
        }}>{c}</span>
      ))}
    </span>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>⚖️ Vereins-Vergleich {season.label} – {leagueLabel(league)}</h2>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <select value={t1} disabled={!names.length} style={select} onChange={e => setTeam1(e.target.value)}>
          {names.map(n => <option key={'1' + n} value={n}>{n}</option>)}
        </select>
        <span style={{ color: '#666', whiteSpace: 'nowrap' }}>vs</span>
        <select value={t2} disabled={!names.length} style={select} onChange={e => setTeam2(e.target.value)}>
          {names.map(n => <option key={'2' + n} value={n}>{n}</option>)}
        </select>
      </div>

      {compareFetch.error && <ErrorState message={compareFetch.error} onRetry={compareFetch.refetch} icon='⚖️' />}
      {!d && compareFetch.loading && <p style={{ color: '#666', textAlign: 'center' }}>⏳ Vergleiche …</p>}

      {d && d.team1 && d.team2 ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {['team1', 'team2'].map(k => {
              const t = d[k];
              return (
                <div key={k} style={{
                  background: '#1a1a1a', borderRadius: '16px', padding: '1rem',
                  borderTop: `3px solid ${theme.primary}`,
                }}>
                  <h3 style={{ margin: '0 0 0.6rem', fontSize: '1rem', color: '#fff', textAlign: k === 'team1' ? 'right' : 'left' }}>{t.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: theme.primary }}>#{t.position ?? '–'}</span>
                    <span style={{ fontSize: '0.72rem', color: '#666' }}>{t.played} Spiele · {t.points} Pkt</span>
                  </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: k === 'team1' ? 'flex-end' : 'flex-start', fontSize: '0.8rem', color: '#ccc', gap: '0.2rem' }}>
                    <span>Siege <strong>{t.wins}</strong> · Unentschieden {t.draws} · Niederlagen <strong>{t.losses}</strong></span>
                    <span>Tore: <strong>{t.goalsFor}</strong> : {t.goalsAgainst} (Diff {t.goalDiff >= 0 ? '+' : ''}{t.goalDiff})</span>
                    <span>Clean Sheets: <strong>{t.cleanSheets}</strong> · Ø {t.avgGoals} Tore/Spiel</span>
                    <span style={{ marginTop: '0.2rem' }}>Form: {formRow(t.form, k === 'team1' ? 'flex-end' : 'flex-start')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {['team1', 'team2'].map(k => {
              const f = formFetch.data?.[k]?.games;
              return (
                <div key={k} style={{ background: '#1a1a1a', borderRadius: '16px', padding: '0.8rem 1rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.primary }}>📈 Formkurve {d[k].name}</span>
                  {f?.length ? <FormChart games={f} team={d[k].name} theme={theme} compact /> : <p style={{ color: '#666', fontSize: '0.75rem' }}>{formFetch.loading ? '⏳ lädt…' : 'Noch keine Formdaten.'}</p>}
                </div>
              );
            })}
          </div>

          <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '0.8rem 1rem' }}>
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: '#888' }}>Gegenüberstellung (Gewinner grün-markiert)</h3>
            <StatRow label="Platz" a={'#' + (d.team1.position ?? '–')} b={'#' + (d.team2.position ?? '–')} theme={theme} />
            <StatRow label="Punkte" a={d.team1.points} b={d.team2.points} theme={theme} strong />
            <StatRow label="Spiele" a={d.team1.played} b={d.team2.played} theme={theme} />
            <StatRow label="Siege" a={d.team1.wins} b={d.team2.wins} theme={theme} />
            <StatRow label="Tore erzielt" a={d.team1.goalsFor} b={d.team2.goalsFor} theme={theme} />
            <StatRow label="Tordifferenz" a={d.team1.goalDiff} b={d.team2.goalDiff} theme={theme} />
            <StatRow label="Clean Sheets" a={d.team1.cleanSheets} b={d.team2.cleanSheets} theme={theme} />
            <StatRow label="Ø Tore/Spiel" a={d.team1.avgGoals} b={d.team2.avgGoals} theme={theme} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.2rem', borderBottom: '1px solid #1f1f1f', fontSize: '0.92rem' }}>
              <span>{formRow(d.team1.form, 'flex-end')}</span>
              <span style={{ color: '#666', fontSize: '0.7rem' }}>Form (letzte 10)</span>
              <span>{formRow(d.team2.form, 'flex-start')}</span>
            </div>
            <p style={{ fontSize: '0.66rem', color: '#555', margin: '0.6rem 0 0' }}>
              xG-Balken sind nur pro Fixture mit API-Football-Key verfügbar (Spieldetail „Prognose“).
            </p>
          </div>

          <h3 style={{ fontSize: '0.9rem', color: '#888', margin: '1.2rem 0 0.5rem' }}>🆚 H2H der letzten Saisons ({d.h2h?.length || 0})</h3>
          {d.h2h?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {d.h2h.slice(-20).map((h, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#1a1a1a', borderRadius: '10px', padding: '0.45rem 0.8rem', fontSize: '0.8rem',
                  color: h.finished ? '#bbb' : '#555', fontStyle: h.finished ? 'normal' : 'italic',
                  borderLeft: `4px solid ${h.finished ? '#333' : '#222'}`,
                }}>
                  <span>{fDate(h.date)}</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>{h.home} <strong>{h.score || '–'}</strong> {h.away}</span>
                  <span style={{ fontSize: '0.62rem', color: '#555' }}>{h.finished ? '' : 'ausstehend'}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#666', fontSize: '0.8rem' }}>Keine direkten Duelle in den letzten Saisons gefunden.</p>}
        </div>
      ) : null}
    </div>
  );
}