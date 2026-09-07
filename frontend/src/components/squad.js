import React from 'react';
import { useFetch } from '../hooks/useFetch';
import { getApiFootballSquad, getApiFootballPlayer, getApiFootballHeatmap } from '../services/api';
import ErrorState from './ErrorState';
import HeatmapField from './HeatmapField';

// API-Football-Zuordnung der Bundesliga-Ligen (Registry-Name + Liga-ID)
export const APIF = {
  bl1: { league: 'bundesliga', leagueId: 78 },
  bl2: { league: 'bundesliga', leagueId: 79 },
};

export const backStyle = (theme) => ({
  background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`,
  borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem',
});

export function TeamCard({ team, theme, onClick }) {
  return (
    <div onClick={() => onClick(team)} style={{
      background: '#1a1a1a', borderRadius: '10px', padding: '1rem',
      cursor: 'pointer', textAlign: 'center',
      border: '1px solid #222', transition: 'border 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = theme.primary}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
    >
      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
        {team.logo
          ? <img src={team.logo} alt={team.name} style={{ maxHeight: '60px', maxWidth: '70px', objectFit: 'contain' }} />
          : <div style={{ fontSize: '2rem' }}>⚽</div>
        }
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ddd' }}>{team.name}</div>
      {team.venue && <div style={{ fontSize: '0.68rem', color: '#555', marginTop: '0.2rem' }}>{team.venue}{team.venueCity ? `, ${team.venueCity}` : ''}</div>}
    </div>
  );
}

export function TeamDetail({ team, theme, onBack, onPlayerClick, apiKey, useApi, aph }) {
  const squadFetch = useFetch(
    () => (useApi && team.id) ? getApiFootballSquad(team.id, aph.league, apiKey) : Promise.resolve(null),
    null,
    [team.id, useApi, apiKey, aph.league]
  );
  const squad = Array.isArray(squadFetch.data) ? squadFetch.data : [];

  return (
    <div>
      <button onClick={onBack} style={backStyle(theme)}>← Zurück</button>

      <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '1.5rem 1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {team.logo && <img src={team.logo} alt={team.name} style={{ width: '70px', objectFit: 'contain', flexShrink: 0 }} />}
          <div>
            <h2 style={{ color: theme.primary, margin: '0 0 0.3rem' }}>{team.name}</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#888' }}>
              {team.founded  && <span>📅 Gegründet {team.founded}</span>}
              {team.country  && <span>🏳️ {team.country}</span>}
              {team.venue    && <span>🏟️ {team.venue}{team.venueCity ? `, ${team.venueCity}` : ''}</span>}
            </div>
          </div>
        </div>
        {team.venueCapacity && (
          <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.6rem' }}>
            👥 {parseInt(team.venueCapacity).toLocaleString('de-DE')} Plätze
          </div>
        )}
      </div>

      {!useApi && (
        <p style={{ fontSize: '0.78rem', color: '#666', textAlign: 'center', padding: '1rem', background: '#1a1a1a', borderRadius: '10px' }}>
          🔑 Kader & Spielerprofile benötigen einen API-Football-Key – lege ihn in den Einstellungen an (⚙️ → API-Football).
        </p>
      )}

      {useApi && (
        <div>
          <h3 style={{ color: theme.primary, fontSize: '1rem', margin: '0 0 0.6rem' }}>🧑‍🤝‍🧑 Kader {team.shortName ? `– ${team.shortName}` : ''}</h3>
          {squadFetch.loading && <p style={{ color: '#666', textAlign: 'center', padding: '1.5rem' }}>⏳ Lade Kader...</p>}
          {squadFetch.error   && <ErrorState message={squadFetch.error} onRetry={squadFetch.refetch} icon='🧑‍🤝‍🧑' />}
          {!squadFetch.loading && !squadFetch.error && squad.length === 0 && (
            <p style={{ color: '#555', textAlign: 'center', padding: '1.5rem' }}>Kein Kader verfügbar.</p>
          )}
          {squad.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
              {squad.map(pl => (
                <button key={pl.id} onClick={() => onPlayerClick(pl)} title='Spielerprofil öffnen'
                  style={{
                    background: '#1a1a1a', border: '1px solid #222', borderRadius: '8px', padding: '0.5rem',
                    cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    transition: 'border 0.2s', color: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = theme.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
                >
                  {pl.photo && <img src={pl.photo} alt='' style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ overflow: 'hidden', width: '100%' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {[pl.number ? `#${pl.number}` : null, pl.position, pl.age ? `${pl.age} J.` : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '0.6rem 0.8rem', textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ddd' }}>{value}</div>
    </div>
  );
}

export function PlayerDetail({ player, theme, onBack, apiKey, aph }) {
  const { data, loading, error, refetch } = useFetch(
    () => getApiFootballPlayer(player.id, aph.league, apiKey),
    null,
    [player.id, apiKey, aph.league]
  );

  if (error && !data) {
    return (
      <div>
        <button onClick={onBack} style={backStyle(theme)}>← Zurück</button>
        <ErrorState message={error} onRetry={refetch} icon='🙍‍♂️' />
      </div>
    );
  }

  const p = data || player;

  const facts = [
    ['Position', p.position], ['Nationalität', p.nationality], ['Geboren', p.birthDate],
    ['Alter', p.age != null ? `${p.age} J.` : null], ['Größe', p.height], ['Gewicht', p.weight],
  ].filter(([, v]) => v != null && v !== '');

  const stats = [
    { key: 'games', label: 'Einsätze', value: p.games },
    { key: 'goals', label: 'Tore', value: p.goals },
    { key: 'assists', label: 'Vorlagen', value: p.assists },
    { key: 'minutes', label: 'Minuten', value: p.minutes },
    { key: 'yellow', label: '🟨', value: p.yellowCards },
    { key: 'red', label: '🟥', value: p.redCards },
  ].filter(s => s.value != null && s.value !== '');

  return (
    <div>
      <button onClick={onBack} style={backStyle(theme)}>← Zurück</button>

      <div style={{ textAlign: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '12px', padding: '1.5rem 1rem', marginBottom: '1rem' }}>
        {p.photo && <img src={p.photo} alt={p.name} style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />}
        <h2 style={{ color: theme.primary, margin: '0.75rem 0 0.25rem' }}>{p.name}</h2>
        <div style={{ color: '#888', fontSize: '0.85rem' }}>
          {[p.number ? `#${p.number}` : null, p.position, p.team, p.nationality].filter(Boolean).join(' · ')}
        </div>
        {loading && !data && <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.5rem' }}>⏳ Lade Profil...</p>}
      </div>

      {facts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
          {facts.map(([label, value]) => <Fact key={label} label={label} value={value} />)}
        </div>
      )}

      {stats.length > 0 && (
        <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', color: '#aaa' }}>📊 Saison-Statistiken {p.team ? `– ${p.team}` : ''}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(64px, 1fr))', gap: '0.4rem' }}>
            {stats.map(s => (
              <div key={s.key} style={{ textAlign: 'center', background: '#111', borderRadius: '6px', padding: '0.5rem 0.2rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: theme.primary }}>{s.value}</div>
                <div style={{ fontSize: '0.62rem', color: '#555', marginTop: '0.15rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {p.rating != null && (
            <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.6rem', textAlign: 'center' }}>
              ⭐ Ø Bewertung: <strong style={{ color: '#aaa' }}>{p.rating}</strong>
            </div>
          )}
        </div>
      )}

      <PlayerHeatmap playerId={p.id} name={p.name} apiKey={apiKey} aph={aph} theme={theme} />
    </div>
  );
}

function PlayerHeatmap({ playerId, name, apiKey, aph, theme }) {
  const isBundesliga = aph?.league === 'bundesliga';
  const heatFetch = useFetch(
    () => (isBundesliga && playerId && apiKey)
      ? getApiFootballHeatmap(playerId, aph.league, apiKey, name)
      : Promise.resolve(null),
    null,
    [playerId, apiKey, aph?.league, name]
  );
  const heat = heatFetch.data;

  if (!isBundesliga) return null;

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
      <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.85rem', color: '#aaa' }}>🗺️ Positions-Heatmap</h4>
      {!apiKey && <p style={{ color: '#666', fontSize: '0.78rem' }}>🔑 API-Football-Key erforderlich (⚙️ Einstellungen).</p>}
      {apiKey && heatFetch.loading && <p style={{ color: '#555', fontSize: '0.8rem' }}>⏳ Lade Heatmap...</p>}
      {apiKey && heatFetch.error && <ErrorState message={heatFetch.error} onRetry={heatFetch.refetch} icon='🗺️' />}
      {apiKey && !heatFetch.loading && !heatFetch.error && heat && (
        heat.points?.length
          ? <HeatmapField team={heat.team} name={heat.name} points={heat.points} theme={theme} />
          : <p style={{ color: '#555', fontSize: '0.78rem' }}>Keine Heatmap-Daten zu diesem Spieler verfügbar (noch kein Einsatz in beendeten Spielen).</p>
      )}
    </div>
  );
}
