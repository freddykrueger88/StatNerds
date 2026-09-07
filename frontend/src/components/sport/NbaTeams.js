import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useSportFavorites } from '../../hooks/useSportFavorites';
import { getNbaTeams } from '../../services/api';
import ErrorState from '../ErrorState';

export default function NbaTeams({ theme }) {
  const [active, setActive] = useState(null);
  const fav = useSportFavorites('sn_fav_nba');
  const { data, loading, error, refetch } = useFetch(() => getNbaTeams(), 60 * 60_000);
  const teams = Array.isArray(data?.teams) ? data.teams : [];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NBA-Teams...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏙️' />;

  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', color: theme.primary, fontSize: '1.05rem' }}>🏙️ NBA – Franchises & Teamfarben</h2>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 0.9rem' }}>
        30 Franchises aus ESPN (eigene Farbthemes). Tippen = Team hervorheben.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
        {sorted.map(t => {
          const isActive = active === t.id;
          const isFav    = fav.isFavorite(t.id);
          return (
            <button key={t.id} onClick={() => setActive(isActive ? null : t.id)} title={t.name}
              style={{
                background: isActive ? `#${t.color}` : '#1a1a1a',
                color: isActive ? '#fff' : '#ccc',
                border: `1px solid ${isFav ? '#facc15' : `#${t.color}88`}`,
                borderRadius: '10px', padding: '0.55rem 0.4rem', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', minHeight: '92px',
              }}>
              {t.logo ? <img src={t.logo} alt='' style={{ height: '34px', width: '34px', objectFit: 'contain' }} /> : <span style={{ fontSize: '1.3rem' }}>🏀</span>}
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>{t.short}</span>
              <small style={{ fontSize: '0.6rem', color: isActive ? '#fff' : '#666' }}>{t.name}</small>
              <span
                onClick={e => { e.stopPropagation(); fav.toggle(t.id); }}
                role='button' tabIndex={0}
                aria-label={isFav ? `${t.name} aus Favoriten entfernen` : `${t.name} zu Favoriten hinzufügen`}
                style={{ fontSize: '0.95rem', cursor: 'pointer', color: isFav ? '#facc15' : '#555', lineHeight: 1 }}
              >
                ★
              </span>
            </button>
          );
        })}
      </div>
      {active && <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.6rem' }}>Ausgewählt: {teams.find(t => t.id === active)?.name}</p>}
    </div>
  );
}
