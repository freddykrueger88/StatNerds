import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getTennisPlayer } from '../../services/api';
import ErrorState from '../ErrorState';

const trendIcon = t => (t === 'up' ? '▲' : t === 'down' ? '▼' : '—');
const trendColor = t => (t === 'up' ? '#4ade80' : t === 'down' ? '#f87171' : '#666');

export default function TennisPlayerProfile({ theme, league, playerId, onBack }) {
  const [skip, setSkip] = useState(false);
  const { data, loading, error, refetch } = useFetch(() => getTennisPlayer(league, playerId), null, [league, playerId, skip]);
  const p = data?.player;

  return (
    <div>
      <button onClick={onBack} style={{ background: '#222', color: '#aaa', border: '1px solid #333', borderRadius: '8px', padding: '0.35rem 0.8rem', cursor: 'pointer', marginBottom: '0.8rem', fontSize: '0.8rem' }}>← Zurück</button>

      {loading ? <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>⏳ Lade Profil...</p>
        : error ? <ErrorState message={error} onRetry={refetch} icon='🎾' /> : p ? (
          <div>
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '16px', padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {p.headshot ? <img src={p.headshot} alt='' style={{ height: '84px', width: '84px', borderRadius: '50%', objectFit: 'cover', background: '#222' }} />
                : <div style={{ height: '84px', width: '84px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎾</div>}
              <div>
                <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.3rem' }}>{p.name}</h2>
                <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#ccc', display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {p.flag && <img src={p.flag} alt={p.country} title={p.country} style={{ height: '15px', width: '22px', objectFit: 'cover' }} />}
                  {p.country && <span>{p.country}</span>}
                  {p.age ? <span>{p.age} Jahre</span> : null}
                  {p.birthPlace && <span style={{ color: '#666' }}>{p.birthPlace}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.6rem', margin: '0.9rem 0' }}>
              {[
                { l: 'Ranking', v: `#${data.rank}` },
                { l: 'Vorige Woche', v: data.previous != null ? `#${data.previous}` : '–' },
                { l: 'Trend', v: trendIcon(data.trend), c: trendColor(data.trend) },
                { l: 'Punkte', v: `${Math.round(data.points).toLocaleString('de-DE')}`, c: theme.primary },
              ].map((x, i) => (
                <div key={i} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.7rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#666' }}>{x.l}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: x.c || '#fff' }}>{x.v}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '0.9rem', color: '#888', margin: '0.5rem 0' }}>Aktuelles Turnier</h3>
            {data.matches?.length ? data.matches.map((m, i) => (
              <div key={i} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.7rem 0.9rem', marginBottom: '0.5rem', borderLeft: `4px solid ${m.live ? '#f87171' : theme.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#666' }}>
                  <span>{m.tournament || 'Tournament'}</span>
                  <span style={{ color: m.live ? '#f87171' : '#888' }}>{m.status}</span>
                </div>
                {m.competitors.map((c, ci) => (
                  <div key={ci} style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: c.winner ? '#fff' : '#999', fontWeight: c.winner ? 'bold' : 'normal' }}>
                    {c.name} {c.sets?.length ? <span style={{ color: theme.primary, fontWeight: 'bold', marginLeft: '0.4rem' }}>{c.sets.join('  ')}</span> : null}
                  </div>
                ))}
                {m.note && <small style={{ color: '#666', display: 'block', marginTop: '0.35rem' }}>{m.note}</small>}
              </div>
            )) : (
              <p style={{ color: '#666', fontSize: '0.8rem' }}>Keine Spiele im aktuellen Turnierfenster gefunden.
                <button onClick={() => setSkip(!skip)} style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: '6px', padding: '0.2rem 0.5rem', marginLeft: '0.5rem', cursor: 'pointer', fontSize: '0.7rem' }}>Neu laden</button>
              </p>
            )}
          </div>
        ) : null}
    </div>
  );
}