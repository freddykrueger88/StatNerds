import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../hooks/useFetch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../hooks/useAuth';
import { submitPick, getMyPicks, getPickRanking, getCurrentGames } from '../services/api';
import ErrorState from '../components/ErrorState';
import LeagueUnavailable from '../components/LeagueUnavailable';
import { leagueSource } from '../leagues';

const RESULTS = ['2', '1', '0', '-1', '-2', '-3', '-4', '-5'];

// Rangliste (global bzw. "unter Freunden" via kommagetrennte E-Mails)
function Ranking({ league, theme }) {
  const { t } = useTranslation();
  const [onlyFriends, setOnlyFriends] = useLocalStorageWrap('sn_picks_friends', '');
  const users = onlyFriends.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 10);

  const { data, loading, error, refetch } = useFetch(
    () => getPickRanking(league, users.length ? users : undefined),
    null, [league, onlyFriends]
  );

  const rank = data?.ranking || [];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '1rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>🏆 {t('picks.ranking')}</h4>
        <input
          value={onlyFriends}
          onChange={e => setOnlyFriends(e.target.value)}
          placeholder={t('picks.friendsPlaceholder')}
          style={{ background: '#111', color: '#ccc', border: '1px solid #333', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: '220px', maxWidth: '100%' }}
        />
      </div>
      {onlyFriends && <div style={{ fontSize: '0.68rem', color: '#666', marginBottom: '0.4rem' }}>{t('picks.friendsMode')} {users.length}</div>}

      {loading && <p style={{ color: '#555', fontSize: '0.8rem' }}>⏳ {t('picks.loadingRanking')}</p>}
      {error && <ErrorState message={error} onRetry={refetch} icon='🏆' />}
      {!loading && !error && (
        rank.length === 0
          ? <p style={{ color: '#555', fontSize: '0.78rem' }}>{t('picks.noRanking')}</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ color: '#666', fontSize: '0.7rem', textAlign: 'left' }}>
                  <th style={{ padding: '0.3rem' }}>#</th>
                  <th style={{ padding: '0.3rem' }}>{t('picks.player')}</th>
                  <th style={{ padding: '0.3rem', textAlign: 'center' }}>{t('picks.points')}</th>
                  <th style={{ padding: '0.3rem', textAlign: 'center' }}>{t('picks.exact')}</th>
                </tr>
              </thead>
              <tbody>
                {rank.map(r => (
                  <tr key={r.userId} style={{ borderTop: '1px solid #222' }}>
                    <td style={{ padding: '0.4rem 0.3rem' }}>{medals[r.rank - 1] || r.rank}</td>
                    <td style={{ padding: '0.4rem 0.3rem', color: '#ddd' }}>
                      {r.email.split('@')[0]}
                      <span style={{ color: '#555', fontSize: '0.7rem' }}>@{r.email.split('@')[1] || ''}</span>
                    </td>
                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: theme.primary, fontWeight: 'bold' }}>{r.points}</td>
                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: '#888' }}>{r.exact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      )}
      <div style={{ fontSize: '0.68rem', color: '#666', marginTop: '0.5rem' }}>
        ⓘ {t('picks.scoringHint')} · {t('picks.rankedGames')}: {data?.rankedGames ?? '-'}
      </div>
    </div>
  );
}

// Minimaler localStorage-Hook (reine Textwerte, keine Funktions-Initializer)
function useLocalStorageWrap(key, def) { return useLocalStorage(key, def); }

// Tipp-Karte: zeigt Spiel mit Ergebnis-Voreinstellung + Speicher-Button
function PickGame({ game, myPick, onSave, busy, theme }) {
  const { t } = useTranslation();
  const final = (game.matchResults || []).find(r => r.resultTypeID === 2);
  const isFinished = !!final;
  const kickoff = new Date(game.matchDateTime);
  const canTip = !isFinished && kickoff.getTime() > Date.now();
  const [home, setHome] = useState(String(myPick?.home_score ?? ''));
  const [away, setAway] = useState(String(myPick?.away_score ?? ''));
  const display = final ? `${final.pointsTeam1}:${final.pointsTeam2}` : 'vs';

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '0.9rem 1rem', marginTop: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.8rem', color: '#ddd', flex: 1, minWidth: '150px' }}>
          <div style={{ color: '#666', fontSize: '0.68rem', marginBottom: '0.2rem' }}>
            {game.group?.groupName} · {new Date(game.matchDateTime).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} {new Date(game.matchDateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div>{game.team1?.teamName || game.team1?.shortName}</div>
          <div>{game.team2?.teamName || game.team2?.shortName}</div>
        </div>

        <div style={{ color: '#facc15', fontWeight: 'bold', fontSize: '1rem', minWidth: '34px', textAlign: 'center' }}>{display}</div>

        {canTip ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <select value={home} onChange={e => setHome(e.target.value)} aria-label='Tipp Heimtore'
              style={selStyle}>{RESULTS.map(v => <option key={v} value={v}>{v === '-1' ? '-' : v}</option>)}</select>
            <span style={{ color: '#666' }}>:</span>
            <select value={away} onChange={e => setAway(e.target.value)} aria-label='Tipp Gasttore'
              style={selStyle}>{RESULTS.map(v => <option key={v} value={v}>{v === '-1' ? '-' : v}</option>)}</select>
            <button onClick={() => onSave({ matchId: String(game.matchID), matchDate: game.matchDateTime, teamHome: game.team1?.teamName, teamAway: game.team2?.teamName, homeScore: home === '-1' ? 0 : Number(home), awayScore: away === '-1' ? 0 : Number(away) }, home === '-1' || away === '-1')}
              disabled={busy || home === '' || away === ''}
              style={{ background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`, borderRadius: '6px', padding: '0.25rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem' }}>
              {myPick ? t('picks.update') : t('picks.save')}
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '0.72rem', color: isFinished ? '#4ade80' : '#666' }}>
            {isFinished ? `✓ ${t('picks.finished')}` : t('picks.closed')}
            {myPick?.points != null && ` · ${myPick.points} ${t('picks.pts')}`}
          </span>
        )}
      </div>
    </div>
  );
}

const selStyle = {
  background: '#111', color: '#ccc', border: '1px solid #333',
  borderRadius: '6px', padding: '0.25rem 0.35rem', fontSize: '0.85rem',
  minWidth: '52px', textAlign: 'center',
};

export default function Picks({ league, theme }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const [savedMsg, setSavedMsg] = useState(null);

  const { data: gamesData, loading: gamesLoading, error: gamesError } = useFetch(
    () => (leagueSource(league) === 'openligadb' ? getCurrentGames(league) : Promise.resolve(null)),
    null, [league]
  );
  const games = Array.isArray(gamesData) ? gamesData : [];

  const mineFetch = useFetch(
    () => (auth.loggedIn ? getMyPicks(league, auth.token) : Promise.resolve(null)),
    null, [league, auth.loggedIn, auth.token]
  );
  const myPicks = Array.isArray(mineFetch.data) ? mineFetch.data : [];
  const pickMatch = m => myPicks.find(p => String(p.match_id) === String(m.matchID));

  if (leagueSource(league) !== 'openligadb') {
    return <LeagueUnavailable league={league} message={t('picks.openligadbOnly')} />;
  }

  const onSave = async (pick, invalid) => {
    if (invalid) { setSavedMsg({ ok: false, text: t('picks.invalid') }); return; }
    setSavedMsg(null);
    const res = await submitPick(league, auth.token, pick);
    if (res?.ok) {
      setSavedMsg({ ok: true, text: t('picks.savedPick') });
      mineFetch.refetch();
    } else {
      setSavedMsg({ ok: false, text: t('picks.saveError') });
    }
  };

  return (
    <div>
      <h2 style={{ color: theme.primary, margin: '0 0 0.2rem', fontSize: '1.1rem' }}>🎯 {t('picks.title')}</h2>
      <p style={{ color: '#666', fontSize: '0.78rem', margin: '0 0 0.8rem' }}>
        {t('picks.subtitle')}: {t('picks.exactRule')} · {t('picks.tendencyRule')}
      </p>

      {!auth.loggedIn && (
        <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#aaa' }}>
          🛆 {t('picks.loginRequired')} – <strong>⚙️ {t('nav.settings')}</strong>
        </div>
      )}

      {savedMsg && (
        <div style={{ background: savedMsg.ok ? '#14281a' : '#2a1414', border: `1px solid ${savedMsg.ok ? '#2faf4f' : '#e04f4f'}`, color: '#ddd', borderRadius: '8px', padding: '0.6rem 0.9rem', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
          {savedMsg.text}
        </div>
      )}

      {gamesLoading && <p style={{ color: '#555', fontSize: '0.8rem' }}>⏳ {t('picks.loadingGames')}</p>}
      {gamesError && <ErrorState message={gamesError} icon='🎯' />}
      {!gamesLoading && !gamesError && (
        games.length === 0
          ? <p style={{ color: '#555', fontSize: '0.8rem' }}>{t('picks.noGames')}</p>
          : <div>{games.map(g => (
            <PickGame key={g.matchID} game={g} myPick={pickMatch(g)}
              onSave={onSave} busy={false} theme={theme} />
          ))}</div>
      )}

      <Ranking league={league} theme={theme} />
    </div>
  );
}
