import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getEspnCurrent } from '../../services/api';
import ErrorState from '../ErrorState';

const fDate = iso => {
  try { return new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }); }
  catch { return iso?.slice(0, 10) || ''; }
};
const gTime = iso => {
  try { return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

function statusColor(s, theme) {
  if (s?.live) return '#f87171';
  if (s?.completed) return '#555';
  return theme.primary;
}

// ── NBA: Scoreboard ──────────────────────────────────────────────────────────
function NbaGames({ theme }) {
  const { data, loading, error, refetch, lastUpdate } = useFetch(() => getEspnCurrent('nba'), 60_000);
  const games = Array.isArray(data?.games) ? data.games : [];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NBA-Spiele...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏀' />;

  const rank = g => (g.live ? 0 : g.completed ? 2 : 1);
  const sorted = [...games].sort((a, b) => (rank(a) - rank(b)) || (a.date || '').localeCompare(b.date || ''));
  const home = g => g.competitors?.find(c => c.homeAway === 'home');
  const away = g => g.competitors?.find(c => c.homeAway === 'away');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>🏀 NBA – Spielplan</h2>
        {lastUpdate && <span style={{ fontSize: '0.72rem', color: '#444' }}>⟳ {new Date(lastUpdate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 1rem' }}>
        Ab dem 30.09.2026 läuft die Saison 2026/27 – vorher zeigt ESPN das letzte abgeschlossene Saisonende (Detroit 60:22 vorne im Osten).
      </p>
      {sorted.map(g => {
        const h = home(g), a = away(g);
        const showScore = g.completed || g.live;
        return (
          <div key={g.id} style={{
            background: '#1a1a1a', borderRadius: '12px', padding: '0.8rem', marginBottom: '0.6rem',
            borderLeft: `4px solid ${statusColor(g, theme)}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#666', marginBottom: '0.4rem' }}>
              <span>{fDate(g.date)} {gTime(g.date)}</span>
              <span style={{ color: g.live ? '#f87171' : '#888', fontWeight: 'bold' }}>
                {g.live ? '🔴 LIVE' : g.completed ? g.detail || 'Beendet' : 'Geplant'}
                {g.period && g.live ? ` · Q${g.period}` : ''}
              </span>
            </div>
            {[a, h].map(t => t && (
              <div key={t.team} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.15rem 0' }}>
                {t.logo ? <img src={t.logo} alt='' style={{ height: '26px', width: '26px', objectFit: 'contain' }} /> : <span style={{ width: '26px' }} />}
                <span style={{ flex: 1 }}>{t.name}</span>
                {showScore && <strong style={{ fontSize: '1.05rem', color: theme.primary }}>{t.score ?? '-'}</strong>}
                {t.record && <small style={{ color: '#666' }}>{t.record}</small>}
              </div>
            ))}
          </div>
        );
      })}
      {!sorted.length && <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>Heute keine NBA-Spiele.</p>}
    </div>
  );
}

// ── Tennis: Turnierkalender + Matches ─────────────────────────────────────────
function TennisGames({ theme, league }) {
  const { data, loading, error, refetch } = useFetch(() => getEspnCurrent(league), 60_000);
  const tournaments = Array.isArray(data?.games) ? data.games : [];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade {league.toUpperCase()}-Turniere...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🎾' />;

  const ranked = [...tournaments];

  return (
    <div>
      <h2 style={{ margin: '0 0 0.75rem', color: theme.primary, fontSize: '1.05rem' }}>
        🎾 {league === 'atp' ? 'ATP' : 'WTA'} – Turnierkalender & Live-Scores
      </h2>
      {tournaments.map(t => (
        <div key={t.id} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.9rem', marginBottom: '0.9rem', borderLeft: `4px solid ${theme.primary}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.95rem', color: t.major ? '#facc15' : '#fff' }}>
              {t.major && '🏆 '}{t.name}
            </strong>
            <span style={{ fontSize: '0.72rem', color: '#666' }}>{fDate(t.start)} → {fDate(t.end)}</span>
          </div>
          {t.matches.slice(0, 30).map((m, i) => (
            <div key={m.id} style={{
              padding: '0.35rem 0.4rem', borderRadius: '8px', marginBottom: '0.25rem',
              background: m.live ? '#22171a' : 'transparent', border: m.live ? '1px solid #f8717155' : '1px solid #242424',
              display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center',
            }}>
              <div style={{ fontSize: '0.8rem', flex: 1 }}>
                {m.competitors.map((c, ci) => (
                  <div key={ci} style={{ fontWeight: c.winner ? 'bold' : 'normal', color: c.winner ? '#fff' : '#999' }}>
                    <span style={{ color: c === m.competitors[0] ? theme.primary : '#777', marginRight: '0.3rem' }}>{ci === 0 ? '●' : '○'}</span>
                    {c.name}
                    {c.seed ? <small style={{ color: '#666', marginLeft: '0.3rem' }}>(Seed {c.seed})</small> : null}
                    {c.sets?.length ? <span style={{ color: '#ccc', float: 'right' }}>{c.sets.join('  ')}</span> : null}
                  </div>
                ))}
                {m.note && <small style={{ color: '#666', display: 'block', marginTop: '0.15rem' }}>{m.note}</small>}
              </div>
              <span style={{ fontSize: '0.72rem', color: m.live ? '#f87171' : m.completed ? '#888' : '#444', whiteSpace: 'nowrap' }}>
                {m.live ? '🔴 LIVE' : m.completed ? 'Final' : 'Geplant'}
              </span>
            </div>
          ))}
          {t.matches.length > 30 && <small style={{ color: '#666' }}>… und {t.matches.length - 30} weitere Spiele</small>}
          {!t.matches.length && <small style={{ color: '#666' }}>Noch keine Matches bekannt.</small>}
        </div>
      ))}
      {!tournaments.length && <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>Keine Turniere im aktuellen Fenster.</p>}
    </div>
  );
}

// ── Sammel-View ─────────────────────────────────────────────────────────────
export default function EspnGames({ theme, league }) {
  return league === 'nba'
    ? <NbaGames theme={theme} />
    : <TennisGames theme={theme} league={league} />;
}
