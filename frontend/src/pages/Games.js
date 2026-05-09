import React, { useEffect, useState, useCallback } from 'react';

function PredictionBar({ home, draw, away, team1, team2 }) {
  return (
    <div style={{ marginTop: '0.8rem' }}>
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '22px', fontSize: '0.72rem' }}>
        <div style={{ width: `${home}%`, background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{home}%</div>
        <div style={{ width: `${draw}%`, background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{draw}%</div>
        <div style={{ width: `${away}%`, background: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{away}%</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666', marginTop: '3px' }}>
        <span>🏠 {team1}</span><span>Unentschieden</span><span>{team2} ✈️</span>
      </div>
    </div>
  );
}

function GoalList({ goals }) {
  if (!goals || goals.length === 0) return null;
  return (
    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#aaa', lineHeight: '1.7' }}>
      {goals.map((g, i) => (
        <span key={i} style={{ marginRight: '1rem' }}>
          ⚽ {g.goalGetterName} {g.matchMinute}'{g.isPenalty ? ' [P]' : ''}{g.isOwnGoal ? ' [ET]' : ''} ({g.scoreTeam1}:{g.scoreTeam2})
        </span>
      ))}
    </div>
  );
}

function GameCard({ game, hero, theme }) {
  const [pred, setPred] = useState(null);
  const t1 = game.team1?.shortName || game.team1?.teamName;
  const t2 = game.team2?.shortName || game.team2?.teamName;
  const results = game.matchResults || [];
  const final = results.find(r => r.resultTypeID === 2) || results[0];
  const half = results.find(r => r.resultTypeID === 1);
  const isLive = !game.matchIsFinished && new Date(game.matchDateTimeUTC) < new Date();
  const isFinished = game.matchIsFinished;

  useEffect(() => {
    if (t1 && t2) {
      fetch(`/api/prediction?team1=${encodeURIComponent(t1)}&team2=${encodeURIComponent(t2)}`)
        .then(r => r.json()).then(d => setPred(d)).catch(() => {});
    }
  }, [t1, t2]);

  return (
    <div style={{
      background: hero ? 'linear-gradient(135deg,#1a1a2e,#16213e)' : '#1a1a1a',
      borderRadius: '12px', padding: hero ? '1.5rem' : '0.9rem',
      marginBottom: '0.75rem',
      borderLeft: `4px solid ${isLive ? '#f87171' : isFinished ? '#333' : theme.primary}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
          {game.team1?.teamIconUrl && <img src={game.team1.teamIconUrl} alt='' style={{ width: hero ? '32px' : '20px', height: hero ? '32px' : '20px', objectFit: 'contain', flexShrink: 0 }} />}
          <span style={{ fontSize: hero ? '1.3rem' : '0.95rem', fontWeight: 'bold' }}>{t1}</span>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: hero ? '2rem' : '1.2rem', color: '#facc15', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {final ? `${final.pointsTeam1} : ${final.pointsTeam2}` : isLive ? '🔴 LIVE' : 'vs'}
          </div>
          {half && <div style={{ fontSize: '0.68rem', color: '#555' }}>HZ {half.pointsTeam1}:{half.pointsTeam2}</div>}
          {isLive && <div style={{ fontSize: '0.68rem', color: '#f87171', animation: 'pulse 1s infinite' }}>● LIVE</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: hero ? '1.3rem' : '0.95rem', fontWeight: 'bold', textAlign: 'right' }}>{t2}</span>
          {game.team2?.teamIconUrl && <img src={game.team2.teamIconUrl} alt='' style={{ width: hero ? '32px' : '20px', height: hero ? '32px' : '20px', objectFit: 'contain', flexShrink: 0 }} />}
        </div>
      </div>
      <div style={{ textAlign: 'center', color: '#555', fontSize: '0.74rem', marginTop: '0.3rem' }}>
        {new Date(game.matchDateTime).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {game.group?.groupName}
      </div>
      {hero && <GoalList goals={game.goals} />}
      {pred?.home_win !== undefined && (
        <PredictionBar home={pred.home_win} draw={pred.draw} away={pred.away_win} team1={t1} team2={t2} />
      )}
    </div>
  );
}

export default function Games({ theme }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [liveCount, setLiveCount] = useState(0);

  const fetchGames = useCallback(() => {
    fetch('/api/games/bl1/current')
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : [];
        setGames(arr);
        setLastUpdate(new Date());
        setLiveCount(arr.filter(g => !g.matchIsFinished && new Date(g.matchDateTimeUTC) < new Date()).length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGames();
    // Auto-refresh alle 60s
    const interval = setInterval(fetchGames, 60000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Spiele...</p>;
  if (!games.length) return <p style={{ color: '#666', textAlign: 'center' }}>Keine Spiele gefunden.</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.1rem' }}>
          {games[0]?.group?.groupName} – Bundesliga 25/26
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.75rem', color: '#555' }}>
          {liveCount > 0 && <span style={{ color: '#f87171', fontWeight: 'bold' }}>🔴 {liveCount} LIVE</span>}
          {lastUpdate && <span>⟳ {lastUpdate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button onClick={fetchGames} style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: '5px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Aktualisieren</button>
        </div>
      </div>

      <GameCard game={games[0]} hero={true} theme={theme} />
      {games.slice(1).map((g, i) => <GameCard key={i} game={g} hero={false} theme={theme} />)}
    </div>
  );
}
