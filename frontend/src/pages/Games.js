import React, { useState, useRef, useCallback } from 'react';
import GameDetail from './GameDetail';
import { GameCardSkeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { useToast } from '../components/Toast';
import { useFetch } from '../hooks/useFetch';
import { useCountdown, formatCountdown } from '../hooks/useCountdown';
import { useFavorites } from '../hooks/useFavorites';
import PredictionBlock from '../components/PredictionBlock';
import { getCurrentGames, getGamesByDay, getMatchdays } from '../services/api';

// ── CountdownBadge ───────────────────────────────────────────────────────────────
function CountdownBadge({ date }) {
  const remaining = useCountdown(date);
  const label     = formatCountdown(remaining);
  if (!label) return null;
  return <span style={{ fontSize: '0.68rem', color: '#facc15', marginLeft: '0.4rem' }}>⏳ {label}</span>;
}

// ── GoalList ─────────────────────────────────────────────────────────────────────
function GoalList({ goals }) {
  if (!goals?.length) return null;
  return (
    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#aaa', lineHeight: '1.8' }}>
      {goals.map((g, i) => (
        <span key={i} style={{ marginRight: '1rem' }}>
          ⚽ {g.goalGetterName} {g.matchMinute}'{g.isPenalty ? ' [P]' : ''}{g.isOwnGoal ? ' [ET]' : ''} ({g.scoreTeam1}:{g.scoreTeam2})
        </span>
      ))}
    </div>
  );
}

// ── GameCard ─────────────────────────────────────────────────────────────────────
function GameCard({ game, hero, theme, onClick }) {
  const { isFavorite, toggle: toggleFav } = useFavorites();
  const t1 = game.team1?.shortName || game.team1?.teamName;
  const t2 = game.team2?.shortName || game.team2?.teamName;
  const results = game.matchResults || [];
  const final   = results.find(r => r.resultTypeID === 2) || results[0];
  const half    = results.find(r => r.resultTypeID === 1);
  const isLive  = !game.matchIsFinished && new Date(game.matchDateTimeUTC) < new Date();
  const isUpcoming = !game.matchIsFinished && !isLive;
  const isFav   = isFavorite(game.team1?.teamId) || isFavorite(game.team2?.teamId);

  // Prediction nur auf Hero-Karte laden – nicht auf allen 9 Karten gleichzeitig
  const showPrediction = hero && !game.matchIsFinished;

  return (
    <div style={{
      background: hero ? 'linear-gradient(135deg,#1a1a2e,#16213e)' : '#1a1a1a',
      borderRadius: '12px', padding: hero ? '1.5rem' : '0.9rem',
      marginBottom: '0.75rem', cursor: 'pointer',
      borderLeft: `4px solid ${isLive ? '#f87171' : game.matchIsFinished ? '#333' : theme.primary}`,
      outline: isFav ? `1px solid ${theme.primary}44` : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        {/* Favoriten-Stern */}
        <button
          onClick={e => { e.stopPropagation(); toggleFav(game.team1?.teamId); }}
          title='Verein favorisieren'
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: isFav ? '#facc15' : '#333', padding: 0, flexShrink: 0 }}
        >★</button>

        <div onClick={() => onClick(game)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
          {game.team1?.teamIconUrl && <img src={game.team1.teamIconUrl} alt='' style={{ width: hero ? '32px' : '20px', height: hero ? '32px' : '20px', objectFit: 'contain', flexShrink: 0 }} />}
          <span style={{ fontSize: hero ? '1.2rem' : '0.92rem', fontWeight: 'bold' }}>{t1}</span>
        </div>

        <div onClick={() => onClick(game)} style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: hero ? '2rem' : '1.2rem', color: '#facc15', fontWeight: 'bold' }}>
            {final ? `${final.pointsTeam1} : ${final.pointsTeam2}` : isLive ? '🔴' : 'vs'}
          </div>
          {half     && <div style={{ fontSize: '0.68rem', color: '#555' }}>HZ {half.pointsTeam1}:{half.pointsTeam2}</div>}
          {isLive   && <div style={{ fontSize: '0.68rem', color: '#f87171' }}>● LIVE</div>}
          {isUpcoming && <CountdownBadge date={game.matchDateTimeUTC} />}
        </div>

        <div onClick={() => onClick(game)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: hero ? '1.2rem' : '0.92rem', fontWeight: 'bold', textAlign: 'right' }}>{t2}</span>
          {game.team2?.teamIconUrl && <img src={game.team2.teamIconUrl} alt='' style={{ width: hero ? '32px' : '20px', height: hero ? '32px' : '20px', objectFit: 'contain', flexShrink: 0 }} />}
        </div>
      </div>

      <div onClick={() => onClick(game)} style={{ textAlign: 'center', color: '#555', fontSize: '0.72rem', marginTop: '0.3rem' }}>
        {new Date(game.matchDateTime).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {game.group?.groupName}
      </div>

      {hero && <GoalList goals={game.goals} />}

      {/* Prediction nur auf Hero-Karte, nach Bedarf geladen via PredictionBlock */}
      {showPrediction && t1 && t2 && (
        <PredictionBlock team1={t1} team2={t2} theme={theme} compact />
      )}

      <div onClick={() => onClick(game)} style={{ textAlign: 'right', fontSize: '0.68rem', color: '#333', marginTop: '0.3rem' }}>Details ›</div>
    </div>
  );
}

// ── Custom Hook: Games + Toast-Logik ───────────────────────────────────────────────
function useGamesWithToast(matchday) {
  const toast          = useToast();
  const prevGoalCountRef = useRef(null);

  const fetcher = useCallback(() => {
    const fn = matchday ? () => getGamesByDay('bl1', matchday) : () => getCurrentGames('bl1');
    return fn().then(list => {
      const games     = Array.isArray(list) ? list : [];
      const goalCount = games.reduce((s, g) => s + (g.goals?.length || 0), 0);
      if (prevGoalCountRef.current !== null && goalCount > prevGoalCountRef.current) {
        toast(`⚽ ${goalCount - prevGoalCountRef.current} neues Tor!`, 'goal', 4000);
      }
      prevGoalCountRef.current = goalCount;
      return games;
    });
  }, [matchday, toast]);

  return useFetch(fetcher, 60_000, [matchday]);
}

// ── Games (Hauptseite) ──────────────────────────────────────────────────────────────────
export default function Games({ theme }) {
  const [matchday,  setMatchday]  = useState(null);
  const [selected,  setSelected]  = useState(null);

  const matchdaysFetch = useFetch(() => getMatchdays('bl1'));
  const matchdays      = Array.isArray(matchdaysFetch.data) ? matchdaysFetch.data : [];

  const { data, loading, error, refetch, lastUpdate } = useGamesWithToast(matchday);
  const games     = Array.isArray(data) ? data : [];
  const liveCount = games.filter(g => !g.matchIsFinished && new Date(g.matchDateTimeUTC) < new Date()).length;

  if (selected) return <GameDetail game={selected} theme={theme} onBack={() => setSelected(null)} />;

  if (loading) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ height: '24px', width: '180px', background: '#1a1a1a', borderRadius: '6px' }} />
      </div>
      {[0,1,2,3,4].map(i => <GameCardSkeleton key={i} />)}
    </div>
  );

  if (error && !games.length) return <ErrorState message={error} onRetry={refetch} icon='⚽' />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>
          {games[0]?.group?.groupName || 'Bundesliga'} – BL 25/26
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {liveCount > 0 && <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '0.8rem' }}>🔴 {liveCount} LIVE</span>}
          <select value={matchday || ''} onChange={e => setMatchday(e.target.value ? Number(e.target.value) : null)}
            style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
            <option value=''>Aktuell</option>
            {matchdays.map(md => <option key={md.groupOrderID} value={md.groupOrderID}>{md.groupName}</option>)}
          </select>
          {lastUpdate && <span style={{ fontSize: '0.72rem', color: '#444' }}>⟳ {new Date(lastUpdate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button onClick={refetch} style={{ background: '#222', color: '#666', border: '1px solid #2a2a2a', borderRadius: '5px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>&#8635;</button>
        </div>
      </div>
      {games[0] && <GameCard game={games[0]} hero={true}  theme={theme} onClick={setSelected} />}
      {games.slice(1).map((g, i) => <GameCard key={i} game={g}  hero={false} theme={theme} onClick={setSelected} />)}
    </div>
  );
}
