import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getNhlCurrent } from '../../services/api';
import ErrorState from '../ErrorState';
import DelNotice from './DelNotice';

const fDate = iso => {
  try { return new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }); }
  catch { return iso?.slice(0, 10) || ''; }
};
const gTime = iso => {
  try { return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

function statusColor(g, theme) {
  if (g.live) return '#f87171';
  if (g.completed) return '#555';
  return theme.primary;
}

export default function NhlGames({ theme }) {
  const { data, loading, error, refetch, lastUpdate } = useFetch(() => getNhlCurrent(), 60_000);
  const games = Array.isArray(data?.games) ? data.games : [];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NHL-Spiele...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏒' />;

  const rank = g => (g.live ? 0 : g.completed ? 2 : 1);
  const sorted = [...games].sort((a, b) => (rank(a) - rank(b)) || (a.date || '').localeCompare(b.date || ''));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>🏒 NHL – Spielplan & Scores</h2>
        {lastUpdate && <span style={{ fontSize: '0.72rem', color: '#444' }}>⟳ {new Date(lastUpdate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
      <DelNotice theme={theme} />
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 1rem' }}>
        Die Saison 2026/27 startet Anfang Oktober – vorher zeigt die NHL den Kalender ohne Ergebnisse.
      </p>
      {sorted.map(g => {
        const showScore = g.completed || g.live;
        return (
          <div key={g.id} style={{
            background: '#1a1a1a', borderRadius: '12px', padding: '0.8rem', marginBottom: '0.6rem',
            borderLeft: `4px solid ${statusColor(g, theme)}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#666', marginBottom: '0.4rem' }}>
              <span>{fDate(g.date)} {gTime(g.date)}{g.venue ? ` · ${g.venue}` : ''}</span>
              <span style={{ color: g.live ? '#f87171' : '#888', fontWeight: 'bold' }}>
                {g.live ? '🔴 LIVE' : g.completed ? 'Beendet' : 'Geplant'}
                {g.period && g.live ? ` · ${g.period}` : ''}
              </span>
            </div>
            {[g.away, g.home].map(t => {
              const score = g.score ? (t.abbrev === g.home.abbrev ? g.score.home : g.score.away) : null;
              return t && (
                <div key={t.abbrev} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.15rem 0' }}>
                  {t.logo ? <img src={t.logo} alt='' style={{ height: '26px', width: '26px', objectFit: 'contain' }} /> : <span style={{ width: '26px' }} />}
                  <span style={{ flex: 1 }}>{t.name}</span>
                  {showScore && <strong style={{ fontSize: '1.05rem', color: theme.primary }}>{score ?? '-'}</strong>}
                </div>
              );
            })}
            {g.tv?.length ? <small style={{ color: '#444' }}>TV: {g.tv.join(', ')}</small> : null}
          </div>
        );
      })}
      {!sorted.length && <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>Keine NHL-Spiele in dieser Woche.</p>}
    </div>
  );
}
