import React, { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState(null);
  const [games, setGames] = useState([]);

  useEffect(() => {
    // /api/health -> nginx -> backend:8000/health
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setHealth(d.status))
      .catch(() => setHealth('Backend nicht erreichbar'));

    // Bundesliga laden
    fetch('/api/api/games/bl1')
      .then(r => r.json())
      .then(d => setGames(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1>📊 StatNerds</h1>
      <p>Penible Sport-Statistiken für echte Daten-Nerds.</p>
      <p>Backend: <strong style={{ color: health === 'OK' ? '#4ade80' : '#f87171' }}>{health || 'Verbinde...'}</strong></p>

      {games.length > 0 && (
        <div>
          <h2>⚽ Bundesliga – Aktuelle Spiele</h2>
          {games.map((g, i) => (
            <div key={i} style={{ background: '#222', borderRadius: '8px', padding: '1rem', marginBottom: '0.5rem' }}>
              <strong>{g.Team1?.TeamName} vs {g.Team2?.TeamName}</strong>
              <span style={{ marginLeft: '1rem', color: '#facc15' }}>
                {g.MatchResults?.[0]?.PointsTeam1 ?? '-'} : {g.MatchResults?.[0]?.PointsTeam2 ?? '-'}
              </span>
              <span style={{ marginLeft: '1rem', color: '#888', fontSize: '0.85rem' }}>
                {new Date(g.MatchDateTime).toLocaleString('de-DE')}
              </span>
            </div>
          ))}
        </div>
      )}

      <p style={{ color: '#888', marginTop: '2rem' }}>Phase 6 (vollständiges UI) kommt als nächstes!</p>
    </div>
  );
}

export default App;
