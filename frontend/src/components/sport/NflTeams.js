import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getNflTeams, getNflStandings } from '../../services/api';
import ErrorState from '../ErrorState';

export default function NflTeams({ theme }) {
  const teams = useFetch(() => getNflTeams(), 60 * 60_000);
  const st = useFetch(() => getNflStandings(), 10 * 60_000);

  if (teams.loading || st.loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NFL-Teams...</p>;
  if (teams.error) return <ErrorState message={teams.error} onRetry={teams.refetch} icon='🏈' />;
  if (st.error)   return <ErrorState message={st.error} onRetry={st.refetch} icon='🏈' />;

  const all = Array.isArray(teams?.data?.teams) ? teams.data.teams : [];
  const confMap = {};
  (st.data?.conferences || []).forEach(c => {
    [...(c.teams || []), ...(c.zones || []).flatMap(z => z.teams || [])].forEach(t => { confMap[t.abbrev] = c.name; });
  });

  const byConf = { 'American Football Conference': [], 'National Football Conference': [] };
  all.forEach(t => (byConf[confMap[t.short]] || byConf['American Football Conference']).push(t));

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', color: theme.primary, fontSize: '1.05rem' }}>🏈 NFL – 32 Franchises</h2>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 0.9rem' }}>
        Die 32 NFL-Franchises aus der keylosen ESPN-API, gruppiert nach Konferenz.
      </p>
      {Object.entries(byConf).map(([conf, list]) => (
        <div key={conf} style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: theme.primary }}>{conf === 'American Football Conference' ? 'AFC' : 'NFC'} – {conf.replace(' Conference', '')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
            {list.length ? list.sort((a, b) => a.name.localeCompare(b.name)).map(t => (
              <div key={t.id} style={{ background: '#1a1a1a', border: '1px solid #242424', borderRadius: '10px', padding: '0.55rem 0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', minHeight: '92px' }}>
                {t.logo ? <img src={t.logo} alt='' style={{ height: '34px', width: '34px', objectFit: 'contain' }} /> : <span style={{ fontSize: '1.3rem' }}>🏈</span>}
                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>{t.short}</span>
                <small style={{ fontSize: '0.6rem', color: '#666', textAlign: 'center', lineHeight: 1.2 }}>{t.name}</small>
              </div>
            )) : <p style={{ color: '#666', fontSize: '0.75rem' }}>Keine Teams gefunden.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
