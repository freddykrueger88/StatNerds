import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getTeamStats } from '../services/api';
import ErrorState from '../components/ErrorState';

const SORT_OPTIONS = [
  { key: 'wins',        label: '🏆 Siege'        },
  { key: 'goals',       label: '⚽ Tore'           },
  { key: 'goalDiff',    label: '📈 Tordiff.'      },
  { key: 'cleanSheets', label: '🧤 Clean Sheets'  },
  { key: 'avgGoals',    label: '📊 Ø Tore/Spiel'  },
  { key: 'winRate',     label: '% Siegquote'      },
];

export default function TeamStats({ theme }) {
  const [sortKey, setSortKey] = useState('wins');
  const { data, loading, error, refetch } = useFetch(() => getTeamStats('bl1'));

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Vereinsstatistiken...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='📈' />;

  const teams = Array.isArray(data) ? [...data].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary }}>📈 Vereinsstatistiken</h2>
        <select value={sortKey} onChange={e => setSortKey(e.target.value)}
          style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
          {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {teams.map((t, i) => (
          <div key={i} style={{ background: '#1a1a1a', borderRadius: '10px', padding: '1rem', borderLeft: `3px solid ${i < 3 ? theme.primary : '#333'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              {t.teamIconUrl && <img src={t.teamIconUrl} alt='' style={{ width: '24px', height: '24px', objectFit: 'contain' }} />}
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{t.teamName}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', fontSize: '0.78rem' }}>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#4ade80', fontWeight: 'bold' }}>{t.wins}</div><div style={{ color: '#444' }}>Siege</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#facc15', fontWeight: 'bold' }}>{t.draws}</div><div style={{ color: '#444' }}>Unentsch.</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#f87171', fontWeight: 'bold' }}>{t.losses}</div><div style={{ color: '#444' }}>Niederl.</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: theme.primary, fontWeight: 'bold' }}>{t.goals}</div><div style={{ color: '#444' }}>Tore</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 'bold', color: '#aaa' }}>{t.cleanSheets || 0}</div><div style={{ color: '#444' }}>Clean Sh.</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 'bold', color: '#aaa' }}>{t.avgGoals?.toFixed(1) || '–'}</div><div style={{ color: '#444' }}>Ø Tore</div></div>
            </div>
            {t.form && (
              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '3px' }}>
                {t.form.slice(-5).split('').map((f, j) => (
                  <span key={j} style={{ background: f === 'W' ? '#4ade80' : f === 'D' ? '#facc15' : '#f87171', color: '#000', borderRadius: '3px', padding: '1px 4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{f === 'W' ? 'S' : f === 'D' ? 'U' : 'N'}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
