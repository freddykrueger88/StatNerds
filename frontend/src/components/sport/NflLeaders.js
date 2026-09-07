import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getNflLeaders } from '../../services/api';
import ErrorState from '../ErrorState';

const CATS = [
  { id: 'passingYards', label: 'Passing Yards' },
  { id: 'passingTouchdowns', label: 'Passing TDs' },
  { id: 'rushingYards', label: 'Rushing Yards' },
  { id: 'rushingTouchdowns', label: 'Rushing TDs' },
  { id: 'receptions', label: 'Receptions' },
  { id: 'sacks', label: 'Sacks' },
  { id: 'interceptions', label: 'Interceptions' },
  { id: 'totalTouchdowns', label: 'Touchdowns' },
  { id: 'totalPoints', label: 'Punkte' },
];

export default function NflLeaders({ theme }) {
  const [cat, setCat] = useState('passingYards');
  const { data, loading, error, refetch } = useFetch(() => getNflLeaders(cat), 60 * 60_000);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>🏈 NFL – Statistik-Rekorde</h2>
        <select value={cat} onChange={e => setCat(e.target.value)} aria-label='Statistik-Kategorie' style={{
          background: '#1a1a1a', color: '#ddd', border: '1px solid #333', borderRadius: '8px', padding: '0.4rem 0.5rem', fontSize: '0.8rem',
        }}>
          {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 1rem' }}>
        Die besten Werte der NFL-Geschichte (Karriere-Rekorde) aus der keylosen ESPN-API.
      </p>
      {loading ? <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>⏳ Lade Rekorde...</p>
        : error ? <ErrorState message={error} onRetry={refetch} icon='🏈' />
        : !(data?.leaders || []).length ? <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>Keine Daten.</p>
        : (
        <div style={{ background: '#16161e', borderRadius: '10px', overflow: 'hidden' }}>
          {data.leaders.map(l => (
            <div key={l.rank} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.8rem', borderBottom: '1px solid #1f1f28' }}>
              <span style={{ width: '1.6rem', textAlign: 'center', fontWeight: 'bold', color: l.rank <= 3 ? theme.primary : '#666' }}>
                {l.rank <= 3 ? ['🥇', '🥈', '🥉'][l.rank - 1] : l.rank}
              </span>
              {l.player.headshot ? <img src={l.player.headshot} alt='' style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ width: '32px', fontSize: '1.1rem', textAlign: 'center' }}>🏈</span>}
              <span style={{ flex: 1, fontSize: '0.85rem' }}>
                {l.player.name || '?'} {l.player.team ? <small style={{ color: '#555' }}>({l.player.team})</small> : null}
              </span>
              <strong style={{ color: theme.primary, fontSize: '0.85rem' }}>{l.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
