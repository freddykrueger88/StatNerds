import React, { useEffect, useState } from 'react';

const API = '';

function PredictionBar({ home, draw, away, team1, team2 }) {
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '24px', fontSize: '0.75rem' }}>
        <div style={{ width: `${home}%`, background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{home}%</div>
        <div style={{ width: `${draw}%`, background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{draw}%</div>
        <div style={{ width: `${away}%`, background: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{away}%</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#888', marginTop: '2px' }}>
        <span>🏠 {team1}</span><span>Unentschieden</span><span>{team2} ✈️</span>
      </div>
    </div>
  );
}

function GameCard({ game, hero }) {
  const [pred, setPred] = useState(null);
  const t1 = game.Team1?.ShortName || game.Team1?.TeamName;
  const t2 = game.Team2?.ShortName || game.Team2?.TeamName;
  const score1 = game.MatchResults?.[0]?.PointsTeam1;
  const score2 = game.MatchResults?.[0]?.PointsTeam2;
  const isLive = !game.MatchIsFinished && new Date(game.MatchDateTime) < new Date();

  useEffect(() => {
    if (t1 && t2) {
      fetch(`${API}/api/prediction?team1=${encodeURIComponent(t1)}&team2=${encodeURIComponent(t2)}`)
        .then(r => r.json())
        .then(d => setPred(d))
        .catch(() => {});
    }
  }, [t1, t2]);

  const style = hero
    ? { background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '12px', padding: '2rem', marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }
    : { background: '#1e1e1e', borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem' };

  return (
    <div style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: hero ? '1.4rem' : '1rem', fontWeight: 'bold' }}>{t1}</span>
        <span style={{ fontSize: hero ? '2rem' : '1.2rem', color: '#facc15', margin: '0 1rem' }}>
          {score1 !== undefined ? `${score1} : ${score2}` : 'vs'}
          {isLive && <span style={{ marginLeft: '0.5rem', color: '#f87171', fontSize: '0.8rem', animation: 'pulse 1s infinite' }}>🔴 LIVE</span>}
        </span>
        <span style={{ fontSize: hero ? '1.4rem' : '1rem', fontWeight: 'bold' }}>{t2}</span>
      </div>
      <div style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.3rem' }}>
        {new Date(game.MatchDateTime).toLocaleString('de-DE')} · {game.LeagueName || 'Bundesliga'}
      </div>
      {pred && pred.home_win !== undefined && (
        <PredictionBar home={pred.home_win} draw={pred.draw} away={pred.away_win} team1={t1} team2={t2} />
      )}
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [games, setGames] = useState([]);
  const [table, setTable] = useState([]);
  const [view, setView] = useState('games');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/health`).then(r => r.json()).then(d => setHealth(d.status)).catch(() => setHealth('Fehler'));
    fetch(`${API}/api/games/bl1/current`)
      .then(r => r.json())
      .then(d => { setGames(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`${API}/api/games/bl1/table`)
      .then(r => r.json())
      .then(d => setTable(Array.isArray(d) ? d.slice(0, 18) : []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#111', color: '#fff', minHeight: '100vh', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>📊 StatNerds</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setView('games')} style={{ background: view==='games' ? '#4ade80' : '#333', color: view==='games' ? '#000' : '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer' }}>Spiele</button>
          <button onClick={() => setView('table')} style={{ background: view==='table' ? '#4ade80' : '#333', color: view==='table' ? '#000' : '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer' }}>Tabelle</button>
        </div>
        <span style={{ fontSize: '0.8rem', color: health === 'OK' ? '#4ade80' : '#f87171' }}>⬤ {health || '...'}</span>
      </div>

      {/* Hero: Erstes Spiel groß */}
      {view === 'games' && games.length > 0 && <GameCard game={games[0]} hero={true} />}

      {/* Weitere Spiele */}
      {view === 'games' && !loading && (
        <div>
          <h3 style={{ color: '#888' }}>Alle Spiele</h3>
          {games.slice(1).map((g, i) => <GameCard key={i} game={g} hero={false} />)}
        </div>
      )}

      {/* Tabelle */}
      {view === 'table' && table.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ color: '#888', borderBottom: '1px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '0.4rem' }}>#</th>
              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Verein</th>
              <th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th style={{ color: '#4ade80' }}>Pkt</th>
            </tr>
          </thead>
          <tbody>
            {table.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '0.4rem' }}>{i + 1}</td>
                <td style={{ padding: '0.4rem' }}>
                  {t.TeamIconUrl && <img src={t.TeamIconUrl} alt='' style={{ width: '18px', marginRight: '6px', verticalAlign: 'middle' }} />}
                  {t.TeamName}
                </td>
                <td style={{ textAlign: 'center' }}>{t.Matches}</td>
                <td style={{ textAlign: 'center' }}>{t.Won}</td>
                <td style={{ textAlign: 'center' }}>{t.Draw}</td>
                <td style={{ textAlign: 'center' }}>{t.Lost}</td>
                <td style={{ textAlign: 'center' }}>{t.Goals}:{t.OpponentGoals}</td>
                <td style={{ textAlign: 'center', color: '#4ade80', fontWeight: 'bold' }}>{t.Points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {loading && <p style={{ color: '#888', textAlign: 'center' }}>Lade Spiele...</p>}
    </div>
  );
}
