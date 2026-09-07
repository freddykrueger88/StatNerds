import React, { useState, useRef, useCallback, useEffect } from 'react';
import GameDetail from './GameDetail';
import { GameCardSkeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { useToast } from '../components/Toast';
import { useFetch } from '../hooks/useFetch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCountdown, formatCountdown } from '../hooks/useCountdown';
import { useFavorites } from '../hooks/useFavorites';
import { usePinnedGames } from '../hooks/usePinnedGames';
import { useHistory } from '../hooks/useHistory';
import PredictionBlock from '../components/PredictionBlock';
import { getCurrentGames, getGamesByDay, getMatchdays, getApiFootballSchedule } from '../services/api';
import { useLeagueSeason } from '../hooks/useLeagueSeason';
import { leagueLabel, leagueSource, seasonLabel } from '../leagues';
import EspnGames from '../components/sport/EspnGames';
import NhlGames from '../components/sport/NhlGames';
import F1Schedule from '../components/sport/F1Schedule';

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

// ── GameCard ──────────────────────────────────────────────────────────────────────────
function GameCard({ game, hero, theme, league, onClick, pinned, togglePin, flash }) {
  const { isFavorite, toggle: toggleFav } = useFavorites();
  const pinHook                          = usePinnedGames();
  const isPinned   = pinned !== undefined ? pinned : pinHook.isPinned(game.matchID);
  const togglePinFn = togglePin !== undefined ? togglePin : pinHook.toggle;
  const t1 = game.team1?.shortName || game.team1?.teamName;
  const t2 = game.team2?.shortName || game.team2?.teamName;
  const results  = game.matchResults || [];
  const final    = results.find(r => r.resultTypeID === 2) || results[0];
  const half     = results.find(r => r.resultTypeID === 1);
  const isLive   = !game.matchIsFinished && new Date(game.matchDateTimeUTC) < new Date();
  const isUpcoming = !game.matchIsFinished && !isLive;
  const isFav    = isFavorite(game.team1?.teamId) || isFavorite(game.team2?.teamId);
  const pinnedState = isPinned;
  const showPrediction = hero && !game.matchIsFinished && leagueSource(league) === 'openligadb';

  return (
    <div className={flash ? 'sn-flashcard' : undefined} style={{
      background: hero ? 'linear-gradient(135deg,#1a1a2e,#16213e)' : '#1a1a1a',
      borderRadius: '12px', padding: hero ? '1.5rem' : '0.9rem',
      marginBottom: '0.75rem', cursor: 'pointer',
      animation: flash ? 'sn-goal-flash 1.6s ease-out' : undefined,
      borderLeft: `4px solid ${isLive ? '#f87171' : game.matchIsFinished ? '#333' : theme.primary}`,
      outline: pinnedState ? `2px solid ${theme.primary}66` : (isFav ? `1px solid ${theme.primary}44` : 'none'),
      boxShadow: pinnedState ? `0 0 0 1px ${theme.primary}33` : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); togglePinFn(game.matchID); }}
            title={pinnedState ? 'Spiel lösen' : 'Spiel anpinnen'}
            aria-label={pinnedState ? `${t1} – ${t2}: Spiel lösen` : `${t1} – ${t2} anpinnen`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: pinnedState ? theme.primary : '#333', padding: '0.3rem', minHeight: '44px', minWidth: '44px' }}
          >📌</button>
          <button
            onClick={e => { e.stopPropagation(); toggleFav(game.team1?.teamId); }}
            title='Verein favorisieren'
            aria-label={isFav ? `${t1} aus Favoriten entfernen` : `${t1} zu Favoriten hinzufügen`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: isFav ? '#facc15' : '#333', padding: '0.3rem', minHeight: '44px', minWidth: '44px' }}
          >★</button>
        </div>

        <div onClick={() => onClick(game)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
          {game.team1?.teamIconUrl && <img src={game.team1.teamIconUrl} alt='' style={{ width: hero ? '32px' : '20px', height: hero ? '32px' : '20px', objectFit: 'contain', flexShrink: 0 }} />}
          <span style={{ fontSize: hero ? '1.2rem' : '0.92rem', fontWeight: 'bold' }}>{t1}</span>
        </div>

        <div onClick={() => onClick(game)} style={{ textAlign: 'center', flexShrink: 0 }}>
          <div aria-live='polite' style={{ fontSize: hero ? '2rem' : '1.2rem', color: '#facc15', fontWeight: 'bold' }}>
            {final ? `${t1} ${final.pointsTeam1} : ${final.pointsTeam2} ${t2}` : isLive ? `${t1} – ${t2} 🔴 LIVE` : `${t1} vs ${t2}`}
          </div>
          {half       && <div style={{ fontSize: '0.68rem', color: '#555' }}>HZ {half.pointsTeam1}:{half.pointsTeam2}</div>}
          {isLive     && <span style={{ fontSize: '0.68rem', color: '#f87171' }}>● LIVE</span>}
          {isUpcoming && <CountdownBadge date={game.matchDateTimeUTC} />}
        </div>

        <div onClick={() => onClick(game)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: hero ? '1.2rem' : '0.92rem', fontWeight: 'bold', textAlign: 'right' }}>{t2}</span>
          {game.team2?.teamIconUrl && <img src={game.team2.teamIconUrl} alt='' style={{ width: hero ? '32px' : '20px', height: hero ? '32px' : '20px', objectFit: 'contain', flexShrink: 0 }} />}
        </div>
      </div>

      <div onClick={() => onClick(game)} style={{ textAlign: 'center', color: '#555', fontSize: '0.72rem', marginTop: '0.3rem' }}>
        {new Date(game.matchDateTime).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {game.group?.groupName}
        {pinnedState && <span style={{ color: theme.primary, fontWeight: 'bold' }}> · 📌 Angepinnt</span>}
      </div>

      {hero && <GoalList goals={game.goals} />}
      {showPrediction && t1 && t2 && <PredictionBlock league={league} team1={t1} team2={t2} theme={theme} compact />}

      <div onClick={() => onClick(game)} style={{ textAlign: 'right', fontSize: '0.68rem', color: '#333', marginTop: '0.3rem' }}>Details ›</div>
    </div>
  );
}

// ── Games + Toast + Goal-Flash ──────────────────────────────────────────────────
function useGamesWithToast(league, matchday) {
  const toast            = useToast();
  const prevGoalCountRef = useRef(null);
  const prevGoalsRef     = useRef(null);   // matchID -> Anzahl Tore
  const [flash, setFlash] = useState({});

  // Liga-/Spieltag-Wechsel: Baseline neu aufbauen (kein Flash beim Wechsel).
  useEffect(() => {
    prevGoalCountRef.current = null;
    prevGoalsRef.current     = null;
  }, [league, matchday]);

  // Aufleuchten nach 1.6s wieder löschen (nur neu anzünden, kein ping-pong).
  useEffect(() => {
    if (!Object.keys(flash).length) return;
    const t = setTimeout(() => setFlash({}), 1600);
    return () => clearTimeout(t);
  }, [flash]);

  const fetcher = useCallback(() => {
    const fn = matchday
      ? () => getGamesByDay(league, matchday)
      : () => getCurrentGames(league);
    return fn().then(list => {
      const games     = Array.isArray(list) ? list : [];
      const goalCount = games.reduce((s, g) => s + (g.goals?.length || 0), 0);
      if (prevGoalCountRef.current !== null && goalCount > prevGoalCountRef.current) {
        toast(`⚽ ${goalCount - prevGoalCountRef.current} neues Tor!`, 'goal', 4000);
      }
      prevGoalCountRef.current = goalCount;

      // Pro Spiel Torzuwachs ermitteln → Flash-Karte (Issue #8).
      const prev = prevGoalsRef.current || {};
      const next = {};
      const bumps = {};
      games.forEach(g => {
        const n = g.goals?.length || 0;
        next[g.matchID] = n;
        if (prev[g.matchID] !== undefined && n > prev[g.matchID]) bumps[g.matchID] = n - prev[g.matchID];
      });
      prevGoalsRef.current = next;
      if (Object.keys(bumps).length) {
        setFlash(f => {
          const acc = { ...f };
          Object.keys(bumps).forEach(id => { acc[id] = (acc[id] || 0) + bumps[id]; });
          return acc;
        });
      }
      return games;
    });
  }, [league, matchday, toast]);

  const fetchState = useFetch(fetcher, 60_000, [league, matchday]);
  return { ...fetchState, flash };
}

// ── API-Football-Fixture → OpenLigaDB-Styled Match ─────────────────────────────────
// Mapping, damit API-Football-Fixtures GameCard / GameDetail durchlaufen können.
const APIF_FINISHED = ['FT', 'AET', 'PEN'];

function fixtureToMatch(f) {
  const finished = APIF_FINISHED.includes(f.status);
  return {
    matchID:           f.fixtureId,
    externalFixtureId: f.fixtureId,
    matchDateTime:     f.date,
    matchDateTimeUTC:  f.date,
    matchIsFinished:   finished,
    roundLabel:        f.round,
    team1: { teamId: `af-${f.home}`, teamName: f.home, shortName: f.home, teamIconUrl: f.homeLogo },
    team2: { teamId: `af-${f.away}`, teamName: f.away, shortName: f.away, teamIconUrl: f.awayLogo },
    matchResults: finished ? [{ resultTypeID: 2, pointsTeam1: f.homeScore ?? 0, pointsTeam2: f.awayScore ?? 0 }] : [],
    goals: [],
    group: { groupName: f.round, groupOrderID: f.round },
    referee: f.referee || null,
  };
}

// ── ApiFootballGames (Spielplan für Ligen ohne OpenLigaDB, z.B. Champions League) ──
function ApiFootballGames({ theme, league }) {
  const [apiKey]    = useLocalStorage('sn_key_api_football', '');
  const [round, setRound]   = useState('');
  const [selected, setSelected] = useState(null);
  const { pinned, isPinned, toggle: togglePin } = usePinnedGames();
  const { push: pushHistory } = useHistory();

  const { data, loading, error, refetch, lastUpdate } = useFetch(
    () => apiKey ? getApiFootballSchedule(league, apiKey).then(list => (Array.isArray(list) ? list : []).map(fixtureToMatch)) : Promise.resolve(null),
    null,
    [league, apiKey]
  );

  const matches   = Array.isArray(data) ? data : [];
  const rounds    = [...new Set(matches.map(m => m.roundLabel).filter(Boolean))];
  const shown     = round ? matches.filter(m => m.roundLabel === round) : matches;
  const liveCount = matches.filter(m => !m.matchIsFinished && new Date(m.matchDateTimeUTC) < new Date()).length;

  const sorted = [...shown].sort((a, b) => Number(isPinned(b.matchID)) - Number(isPinned(a.matchID)));
  const openGame = g => {
    pushHistory('game', g.matchID, `${g.team1?.shortName || g.team1?.teamName} – ${g.team2?.shortName || g.team2?.teamName}`, { league, game: g });
    setSelected(g);
  };

  if (selected) return <GameDetail game={selected} league={league} theme={theme} onBack={() => setSelected(null)} />;

  if (!apiKey) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔑</div>
      <p style={{ fontSize: '0.9rem', margin: '0 auto', maxWidth: '420px' }}>
        Für die <strong style={{ color: '#aaa' }}>{leagueLabel(league)}</strong> wird ein API-Football-Key benötigt.
      </p>
      <p style={{ fontSize: '0.78rem', color: '#444', marginTop: '0.4rem' }}>
        Lege ihn in den Einstellungen an (⚙️ → Datenquellen → API-Football).
      </p>
    </div>
  );

  if (loading) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ height: '24px', width: '180px', background: '#1a1a1a', borderRadius: '6px' }} />
      </div>
      {[0,1,2,3,4].map(i => <GameCardSkeleton key={i} />)}
    </div>
  );

  if (error && !matches.length) return <ErrorState message={error} onRetry={refetch} icon='⚽' />;

  const renderCard = (g, hero) => (
    <GameCard key={g.matchID} game={g} hero={hero} theme={theme} league={league} onClick={openGame}
      pinned={isPinned(g.matchID)} togglePin={togglePin} />
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>{leagueLabel(league)} – {seasonLabel()}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {liveCount > 0 && <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '0.8rem' }}>🔴 {liveCount} LIVE</span>}
          {rounds.length > 1 && (
            <select value={round} onChange={e => setRound(e.target.value)}
              style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
              <option value=''>Alle Runden</option>
              {rounds.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          {lastUpdate && <span style={{ fontSize: '0.72rem', color: '#444' }}>⟳ {new Date(lastUpdate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button onClick={refetch} style={{ background: '#222', color: '#666', border: '1px solid #2a2a2a', borderRadius: '5px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>&#8635;</button>
        </div>
      </div>

      {sorted.length === 0 && <p style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>Keine Spiele gefunden.</p>}

      {round
        ? (
          <div>
            <h3 style={{ color: '#999', fontSize: '0.8rem', margin: '0.5rem 0' }}>{round}</h3>
            {sorted.map((g, i) => renderCard(g, i === 0))}
          </div>
        )
        : rounds.map((r, ri) => (
            <div key={r}>
              <h3 style={{ color: '#999', fontSize: '0.8rem', margin: `${ri === 0 ? 0 : 1}rem 0 0.5rem` }}>{r}</h3>
              {sorted.filter(m => m.roundLabel === r).map((g, i) => renderCard(g, ri === 0 && i === 0))}
            </div>
          ))}
    </div>
  );
}

// ── Games (Hauptseite) ───────────────────────────────────────────────────────────────────
function OpenLigaDbGames({ theme, league }) {
  const [matchday, setMatchday] = useState(null);
  const [selected, setSelected] = useState(null);
  const season = useLeagueSeason(league);
  const { isPinned, toggle: togglePin } = usePinnedGames();
  const { push: pushHistory } = useHistory();

  // Liga-Wechsel: Spieltag-Auswahl zurücksetzen
  useEffect(() => { setMatchday(null); }, [league]);

  const matchdaysFetch = useFetch(() => getMatchdays(league), null, [league]);
  const matchdays      = Array.isArray(matchdaysFetch.data) ? matchdaysFetch.data : [];

  const { data, loading, error, refetch, lastUpdate, flash } = useGamesWithToast(league, matchday);
  const games     = Array.isArray(data) ? data : [];
  const liveCount = games.filter(g => !g.matchIsFinished && new Date(g.matchDateTimeUTC) < new Date()).length;

  const openGame = g => {
    pushHistory('game', g.matchID, `${g.team1?.shortName || g.team1?.teamName} – ${g.team2?.shortName || g.team2?.teamName}`, { league, game: g });
    setSelected(g);
  };
  const sorted = [...games].sort((a, b) => Number(isPinned(b.matchID)) - Number(isPinned(a.matchID)));

  if (selected) return <GameDetail game={selected} league={league} theme={theme} onBack={() => setSelected(null)} />;

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
        {!season.isCurrent && season.loading === false && (
          <p style={{ fontSize: '0.75rem', color: '#dca500', background: '#1f1c0e', border: '1px solid #3a3314', borderRadius: '8px', padding: '0.4rem 0.7rem', margin: 0, flexBasis: '100%' }}>
            ⚠️ Für diese Liga ist in der Datenquelle noch keine Saison {seasonLabel()} verfügbar – angezeigt wird die letzte abgeschlossene Saison <strong>{season.label}</strong>. Sobald die neue Saison beginnt, erscheint sie hier automatisch.
          </p>
        )}
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>
          {games[0]?.group?.groupName || leagueLabel(league)} – {season.label}
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

      {sorted[0] && <GameCard key={`${sorted[0].matchID}-f${flash[sorted[0].matchID] || 0}`} game={sorted[0]} hero={true} theme={theme} league={league} onClick={openGame}
        pinned={isPinned(sorted[0].matchID)} togglePin={togglePin} flash={flash[sorted[0].matchID] || 0} />}
      {sorted.slice(1).map((g, i) => (
        <GameCard key={`${g.matchID}-f${flash[g.matchID] || 0}`} game={g} hero={false} theme={theme} league={league} onClick={openGame}
          pinned={isPinned(g.matchID)} togglePin={togglePin} flash={flash[g.matchID] || 0} />
      ))}
    </div>
  );
}

export default function Games({ theme, league }) {
  const source = leagueSource(league);
  if (source === 'espn')     return <EspnGames theme={theme} league={league} />;
  if (source === 'nhl')      return <NhlGames theme={theme} />;
  if (source === 'f1')       return <F1Schedule theme={theme} />;
  if (source === 'openligadb') return <OpenLigaDbGames theme={theme} league={league} />;
  return <ApiFootballGames theme={theme} league={league} />;
}
