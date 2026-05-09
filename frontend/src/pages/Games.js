import React, { useEffect, useState } from 'react';

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
    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#aaa' }}>
      {goals.map((g, i) => (
        <span key={i} style={{ marginRight: '1rem' }}>
          ⚽ {g.goalGetterName} {g.matchMinute}' ({g.scoreTeam1}:{g.scoreTeam2}){g.isPenalty ? ' [P]' : ''}{g.isOwnGoal ? ' [ET]' : ''}
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
      borderRadius: '12px', padding: hero ? '2rem' : '1rem',
      marginBottom: '0.75rem',
      borderLeft: `4px solid ${isLive ? '#f87171' : isFinished ? '#555' : theme.primary}`
    }}>
      {/* Teams + Score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {game.team1?.teamIconUrl && <img src={game.team1.teamIconUrl} alt='' style={{ width: hero ? '36px' : '22px', height: hero ? '36px' : '22px', objectFit: 'contain' }} />}
          <span style={{ fontSize: hero ? '1.4rem' : '1rem', fontWeight: 'bold' }}>{t1}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: hero ? '2.2rem' : '1.3rem', color: '#facc15', fontWeight: 'bold' }}>
            {final ? `${final.pointsTeam1} : ${final.pointsTeam2}` : isLive ? '🔴 LIVE' : 'vs'}
          </div>
          {half && <div style={{ fontSize: '0.72rem', color: '#666' }}>HZ: {half.pointsTeam1}:{half.pointsTeam2}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row-reverse' }}>
          {game.team2?.teamIconUrl && <img src={game.team2.teamIconUrl} alt='' style={{ width: hero ? '36px' : '22px', height: hero ? '36px' : '22px', objectFit: 'contain' }} />}
          <span style={{ fontSize: hero ? '1.4rem' : '1rem', fontWeight: 'bold' }}>{t2}</span>
        </div>
      </div>

      {/* Meta */}
      <div style={{ textAlign: 'center', color: '#666', fontSize: '0.78rem', marginTop: '0.3rem' }}>
        {new Date(game.matchDateTime).toLocaleString('de-DE')} · {game.group?.groupName}
        {isFinished && <span style={{ marginLeft: '0.5rem', color: '#555' }}>✓ Abgeschlossen</span>}
      </div>

      {/* Tore */}
      {hero && <GoalList goals={game.goals} />}

      {/* Prediction */}
      {pred && pred.home_win !== undefined && (
        <PredictionBar home={pred.home_win} draw={pred.draw} away={pred.away_win} team1={t1} team2={t2} />
      )}
      {pred && <div style={{ fontSize: '0.68rem', color: '#444', marginTop: '2px' }}>Basis: {pred.based_on}</div>}
    </div>
  );
}

export default function Games({ theme }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroOnly, setHeroOnly] = useState(false);

  useEffect(() => {
    fetch('/api/games/bl1/current')
      .then(r => r.json())
      .then(d => { setGames(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Spiele...</p>;
  if (!games.length) return <p style={{ color: '#666', textAlign: 'center' }}>Keine Spiele gefunden.</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: theme.primary }}>33. Spieltag – Bundesliga 2025/26</h2>
        <button onClick={() => setHeroOnly(!heroOnly)} style={{
          background: '#222', color: '#aaa', border: '1px solid #333',
          borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem'
        }}>{heroOnly ? '☰ Alle Spiele' : '⬜ Nur Highlight'}</button>
      </div>

      {/* Hero – erstes Spiel groß */}
      <GameCard game={games[0]} hero={true} theme={theme} />

      {/* Rest */}
      {!heroOnly && games.slice(1).map((g, i) => <GameCard key={i} game={g} hero={false} theme={theme} />)}
    </div>
  );
}
