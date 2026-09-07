import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useHistory } from '../../hooks/useHistory';
import { useSportFavorites } from '../../hooks/useSportFavorites';
import { getTennisRankings } from '../../services/api';
import ErrorState from '../ErrorState';
import TennisPlayerProfile from './TennisPlayerProfile';

const trendIcon = t => (t === 'up' ? '▲' : t === 'down' ? '▼' : '—');
const trendColor = t => (t === 'up' ? '#4ade80' : t === 'down' ? '#f87171' : '#666');

export default function TennisRankings({ theme, league }) {
  const [selected, setSelected] = useState(null);
  const { push: pushHistory } = useHistory();
  const fav = useSportFavorites('sn_fav_tennis');
  const { data, loading, error, refetch } = useFetch(() => getTennisRankings(league), 30 * 60_000);
  const ranks = Array.isArray(data?.ranks) ? data.ranks : [];

  const openPlayer = player => {
    pushHistory('player', player.id, player.name || player.id, { league });
    setSelected(player.id);
  };

  if (selected) return <TennisPlayerProfile theme={theme} league={league} playerId={selected} onBack={() => setSelected(null)} />;

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade {league.toUpperCase()}-Rangliste...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏆' />;

  const top = ranks.slice(0, 10);

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', color: theme.primary, fontSize: '1.05rem' }}>
        🏆 {league === 'atp' ? 'ATP' : 'WTA'} – Weltrangliste ({data?.season || ''})
      </h2>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 0.9rem' }}>Quelle: ESPN · 150 Plätze · Tippen = Profil ansehen</p>

      {top.map(r => (
        <div key={r.player.id} onClick={() => openPlayer(r.player)} style={{
          display: 'flex', alignItems: 'center', gap: '0.7rem', background: '#1a1a1a',
          borderRadius: '12px', padding: '0.55rem 0.8rem', marginBottom: '0.5rem', cursor: 'pointer',
          borderLeft: `4px solid ${r.rank <= 3 ? '#facc15' : theme.primary}`,
        }}>
          <span style={{ width: '28px', textAlign: 'center', fontWeight: 'bold', color: r.rank <= 3 ? '#facc15' : '#999', fontSize: '1rem' }}>{r.rank}</span>
          {r.player.headshot ? <img src={r.player.headshot} alt='' style={{ height: '40px', width: '40px', borderRadius: '50%', objectFit: 'cover', background: '#222' }} /> : <span style={{ fontSize: '1.3rem' }}>{r.player.flag ? '' : '🎾'}</span>}
          {r.player.flag && <img src={r.player.flag} alt={r.player.country} title={r.player.country} style={{ height: '14px', width: '20px', objectFit: 'cover', borderRadius: '2px' }} />}
          <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: 'bold' }}>{r.player.name}</span>
          <span onClick={e => { e.stopPropagation(); fav.toggle(r.player.id); }} role='button' tabIndex={0}
            aria-label={fav.isFavorite(r.player.id) ? `${r.player.name} aus Favoriten entfernen` : `${r.player.name} zu Favoriten hinzufügen`}
            style={{ fontSize: '0.95rem', cursor: 'pointer', color: fav.isFavorite(r.player.id) ? '#facc15' : '#555', lineHeight: 1 }}>
            ★
          </span>
          <span style={{ color: trendColor(r.trend) }}>{trendIcon(r.trend)} {r.previous || '–'}</span>
          <span style={{ color: theme.primary, fontWeight: 'bold', fontSize: '0.85rem' }}>{Math.round(r.points).toLocaleString('de-DE')} Pkt</span>
        </div>
      ))}

      <details style={{ marginTop: '0.6rem' }}>
        <summary style={{ cursor: 'pointer', color: '#888', fontSize: '0.85rem' }}>Alle {ranks.length} Plätze anzeigen</summary>
        <div style={{ marginTop: '0.5rem' }}>
          {ranks.slice(10).map(r => (
            <div key={r.player.id} onClick={() => openPlayer(r.player)} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.6rem', cursor: 'pointer',
              borderBottom: '1px solid #1f1f1f', fontSize: '0.82rem',
            }}>
              <span style={{ width: '26px', textAlign: 'center', color: '#666' }}>{r.rank}</span>
              {r.player.flag && <img src={r.player.flag} alt='' style={{ height: '12px', width: '17px', objectFit: 'cover' }} />}
              <span style={{ flex: 1 }}>{r.player.name}</span>
              <span onClick={e => { e.stopPropagation(); fav.toggle(r.player.id); }} role='button' tabIndex={0} aria-label='Favorit umschalten'
                style={{ fontSize: '0.9rem', cursor: 'pointer', color: fav.isFavorite(r.player.id) ? '#facc15' : '#555', lineHeight: 1 }}>
                ★
              </span>
              <span style={{ color: trendColor(r.trend) }}>{trendIcon(r.trend)}</span>
              <span style={{ color: theme.primary }}>{Math.round(r.points).toLocaleString('de-DE')}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
