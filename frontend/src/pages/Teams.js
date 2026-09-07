import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useHistory } from '../hooks/useHistory';
import { getTeamList, getApiFootballTeams } from '../services/api';
import ErrorState from '../components/ErrorState';
import LeagueUnavailable from '../components/LeagueUnavailable';
import { TeamCard, TeamDetail, PlayerDetail, APIF } from '../components/squad';
import NbaTeams from '../components/sport/NbaTeams';
import TennisRankings from '../components/sport/TennisRankings';
import { leagueSource } from '../leagues';

export default function Teams({ theme, league }) {
  const [selected, setSelected] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [search,   setSearch]   = useState('');
  const [apiKey] = useLocalStorage('sn_key_api_football', '');
  const { push: pushHistory } = useHistory();

  const aph    = APIF[league] || APIF.bl1;
  const useApi = !!apiKey;

  // Liste: mit Key echte API-Football-Teams (inkl. ID/Logo), ohne Key statische Liste
  const listFetch = useFetch(
    () => useApi ? getApiFootballTeams(aph.league, apiKey, aph.leagueId) : getTeamList(league),
    null,
    [league, useApi, apiKey]
  );
  const teamList = Array.isArray(listFetch.data) ? listFetch.data : [];

  const source = leagueSource(league);
  if (source === 'espn') {
    if (league === 'nba') return <NbaTeams theme={theme} />;
    return <TennisRankings theme={theme} league={league} />;
  }
  if (source !== 'openligadb') return <LeagueUnavailable league={league} />;

  const openTeam = t => {
    pushHistory('team', t.id, t.name || t.short || t.shortName, { league });
    setSelected(t);
  };
  const openPlayer = p => {
    pushHistory('player', p.playerId || p.id, p.name, { league });
    setSelectedPlayer(p);
  };

  if (selected && selectedPlayer) {
    return (
      <PlayerDetail player={selectedPlayer} theme={theme} apiKey={apiKey} aph={aph}
        onBack={() => setSelectedPlayer(null)} />
    );
  }

  if (selected) {
    return (
      <TeamDetail team={selected} theme={theme} apiKey={apiKey} useApi={useApi} aph={aph}
        onBack={() => { setSelected(null); setSelectedPlayer(null); }}
        onPlayerClick={openPlayer} />
    );
  }

  if (listFetch.loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Vereine...</p>;
  if (listFetch.error)   return <ErrorState message={listFetch.error} onRetry={listFetch.refetch} icon='🏟️' />;

  const q = search.toLowerCase();
  const filtered = teamList.filter(t =>
    (t.name || '').toLowerCase().includes(q) ||
    ((t.short || t.shortName) || '').toLowerCase().includes(q)
  );

  return (
    <div>
      <h2 style={{ color: theme.primary, marginBottom: '0.8rem' }}>🏟️ Vereine</h2>
      {!useApi && <p style={{ fontSize: '0.72rem', color: '#444', marginTop: '-0.4rem', marginBottom: '0.6rem' }}>
        💡 Mit API-Football-Key werden Kader & echte Vereinsprofile angezeigt.
      </p>}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder='🔍 Verein suchen...'
        style={{ width: '100%', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {filtered.map(t => <TeamCard key={t.id} team={t} theme={theme} onClick={openTeam} />)}
      </div>
    </div>
  );
}
