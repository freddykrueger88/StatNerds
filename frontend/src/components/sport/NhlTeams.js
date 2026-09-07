import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getNhlTeams } from '../../services/api';
import ErrorState from '../ErrorState';
import DelNotice from './DelNotice';

export default function NhlTeams({ theme }) {
  const { data, loading, error, refetch } = useFetch(() => getNhlTeams(), 60 * 60_000);
  const teams = Array.isArray(data?.teams) ? data.teams : [];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NHL-Teams...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏒' />;

  const byConf = {'Eastern': [], 'Western': []};
  teams.forEach(t => (byConf[t.conference] || byConf.Eastern).push(t));

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', color: theme.primary, fontSize: '1.05rem' }}>🏒 NHL – 32 Franchises</h2>
      <DelNotice theme={theme} />
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 0.9rem' }}>
        Die 32 NHL-Franchises aus der offiziellen NHL-API.
      </p>
      {['Eastern', 'Western'].map(conf => (
        <div key={conf} style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: theme.primary }}>{conf} Conference</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
            {byConf[conf].sort((a, b) => a.name.localeCompare(b.name)).map(t => (
              <div key={t.id} style={{ background: '#1a1a1a', border: '1px solid #242424', borderRadius: '10px', padding: '0.55rem 0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', minHeight: '92px' }}>
                {t.logo ? <img src={t.logo} alt='' style={{ height: '34px', width: '34px', objectFit: 'contain' }} /> : <span style={{ fontSize: '1.3rem' }}>🏒</span>}
                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>{t.short}</span>
                <small style={{ fontSize: '0.6rem', color: '#666', textAlign: 'center', lineHeight: 1.2 }}>{t.name}</small>
                <small style={{ fontSize: '0.58rem', color: '#444' }}>{t.division}</small>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
