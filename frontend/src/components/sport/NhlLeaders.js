import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getNhlLeaders } from '../../services/api';
import ErrorState from '../ErrorState';
import DelNotice from './DelNotice';

export default function NhlLeaders({ theme }) {
  const { data, loading, error, refetch } = useFetch(() => getNhlLeaders(), 10 * 60_000);
  const goals = Array.isArray(data?.goals) ? data.goals : [];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NHL-Torschützen...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏒' />;

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', color: theme.primary, fontSize: '1.05rem' }}>🏒 NHL – Torschützen</h2>
      <DelNotice theme={theme} />
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 0.9rem' }}>
        Top 20 nach Toren (Saison {data?.season || ''}).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.6rem 0.8rem' }}>
          {goals.map((p, i) => (
            <div key={p.id || i} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0',
              borderBottom: i < goals.length - 1 ? '1px solid #1f1f1f' : 'none', fontSize: '0.85rem',
            }}>
              <span style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', color: i < 3 ? '#facc15' : '#888' }}>{i + 1}</span>
              {p.headshot ? <img src={p.headshot} alt='' style={{ height: '34px', width: '34px', borderRadius: '50%', background: '#222', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.1rem' }}>🏒</span>}
              <span style={{ flex: 1, fontWeight: 'bold' }}>{p.name}</span>
              <small style={{ color: '#666', whiteSpace: 'nowrap' }}>{p.team}</small>
              <strong style={{ color: theme.primary, minWidth: '26px', textAlign: 'right' }}>{p.goals}</strong>
              <small style={{ color: '#555', width: '52px', textAlign: 'right' }}>{p.points ? `${p.points} Pkt` : `SP ${p.games ?? ''}`}</small>
            </div>
          ))}
          {!goals.length && <p style={{ color: '#666', textAlign: 'center', padding: '1rem 0' }}>Noch keine Torschützen-Daten.</p>}
        </div>
      </div>
    </div>
  );
}
