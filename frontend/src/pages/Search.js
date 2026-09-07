import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getTeamList, getApiFootballTeams, getApiFootballPlayerSearch } from '../services/api';
import ErrorState from '../components/ErrorState';
import LeagueUnavailable from '../components/LeagueUnavailable';
import { TeamCard, TeamDetail, PlayerDetail, APIF } from '../components/squad';
import { leagueLabel, leagueSource } from '../leagues';

export default function Search({ theme, league }) {
  const [q, setQ] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [apiKey] = useLocalStorage('sn_key_api_football', '');

  const aph    = APIF[league] || APIF.bl1;
  const useApi = !!apiKey;
  const query  = q.trim();

  const teamFetch = useFetch(
    () => useApi ? getApiFootballTeams(aph.league, apiKey, aph.leagueId) : getTeamList(league),
    null,
    [league, useApi, apiKey]
  );
  const teams = Array.isArray(teamFetch.data) ? teamFetch.data : [];

  const wantPlayers = query.length >= 2;
  const playerFetch = useFetch(
    () => (wantPlayers && useApi) ? getApiFootballPlayerSearch(query, aph.league, apiKey, aph.leagueId) : Promise.resolve(null),
    null,
    [query, useApi, apiKey]
  );
  const players = Array.isArray(playerFetch.data) ? playerFetch.data : [];

  if (leagueSource(league) !== 'openligadb') return <LeagueUnavailable league={league} />;

  if (selectedPlayer) {
    return (
      <PlayerDetail player={selectedPlayer} theme={theme} apiKey={apiKey} aph={aph}
        onBack={() => setSelectedPlayer(null)} />
    );
  }
  if (selectedTeam) {
    return (
      <TeamDetail team={selectedTeam} theme={theme} apiKey={apiKey} useApi={useApi} aph={aph}
        onBack={() => setSelectedTeam(null)}
        onPlayerClick={setSelectedPlayer} />
    );
  }

  const ql = query.toLowerCase();
  const teamHits = query
    ? teams.filter(t =>
        (t.name || '').toLowerCase().includes(ql) ||
        ((t.short || t.shortName) || '').toLowerCase().includes(ql)
      ).slice(0, 12)
    : [];

  return (
    <div>
      <h2 style={{ color: theme.primary, marginBottom: '0.8rem' }}>🔍 Suche – {leagueLabel(league)}</h2>
      <input
        autoFocus
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder='Verein oder Spieler suchen...'
        style={{ width: '100%', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' }}
      />

      {!query && <p style={{ color: '#555', textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem' }}>Suchbegriff eingeben – z.B. „Kane" oder „Leipzig".</p>}

      {query && !useApi && (
        <p style={{ fontSize: '0.78rem', color: '#666', background: '#1a1a1a', borderRadius: '8px', padding: '0.7rem 1rem' }}>
          🔑 Die Spieler-Suche benötigt einen API-Football-Key (Einstellungen → API-Football). Die Vereins-Suche funktioniert weiterhin.
        </p>
      )}

      {query && (
        <div>
          {teamHits.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: theme.primary, fontSize: '0.95rem', margin: '0 0 0.5rem' }}>🏟️ Vereine</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem' }}>
                {teamHits.map(t => <TeamCard key={t.id} team={t} theme={theme} onClick={setSelectedTeam} />)}
              </div>
            </div>
          )}

          {wantPlayers && (
            <div>
              <h3 style={{ color: theme.primary, fontSize: '0.95rem', margin: '0 0 0.5rem' }}>🙍‍♂️ Spieler</h3>
              {!useApi
                ? <p style={{ color: '#555', fontSize: '0.78rem' }}>Nicht verfügbar ohne API-Football-Key.</p>
                : playerFetch.loading
                  ? <p style={{ color: '#666', padding: '1rem 0', fontSize: '0.85rem' }}>⏳ Suche Spieler...</p>
                  : playerFetch.error
                    ? <ErrorState message={playerFetch.error} onRetry={playerFetch.refetch} icon='🙍‍♂️' />
                    : players.length === 0
                      ? <p style={{ color: '#555', padding: '1rem 0', fontSize: '0.85rem' }}>Keine Spieler gefunden.</p>
                      : players.map(p => (
                          <button key={p.id} onClick={() => setSelectedPlayer(p)} title='Spielerprofil öffnen'
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                              background: '#1a1a1a', border: '1px solid #222', borderRadius: '8px',
                              padding: '0.5rem 0.7rem', marginBottom: '0.4rem', cursor: 'pointer', color: 'inherit',
                              textAlign: 'left', transition: 'border 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = theme.primary}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
                          >
                            {p.photo && <img src={p.photo} alt='' style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                              <div style={{ fontSize: '0.68rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {[p.team?.name, p.position, p.age ? `Alter ${p.age}` : null].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                            <span style={{ color: '#555', fontSize: '0.7rem' }}>›</span>
                          </button>
                        ))}
            </div>
          )}

          {teamHits.length === 0 && !wantPlayers && (
            <p style={{ color: '#555', fontSize: '0.8rem' }}>Keine Vereine gefunden.</p>
          )}
        </div>
      )}
    </div>
  );
}
