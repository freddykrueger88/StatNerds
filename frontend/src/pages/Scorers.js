import React, { useEffect, useState } from 'react';

export default function Scorers({ theme }) {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games/bl1/scorers')
      .then(r => r.json())
      .then(d => { setScorers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Torjäger...</p>;
  if (!scorers.length) return <p style={{ color: '#666', textAlign: 'center' }}>Keine Daten verfügbar.</p>;

  return (
    <div>
      <h2 style={{ color: theme.primary }}>⚽ Torjägerliste 2025/26</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'center' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem', width: '2rem' }}>#</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Spieler</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Verein</th>
            <th>Tore</th>
            <th>Elfmeter</th>
            <th>Eigentore</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((s, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #1a1a1a', background: i < 3 ? 'rgba(250,204,21,0.04)' : 'transparent' }}>
              <td style={{ padding: '0.5rem', color: i === 0 ? '#facc15' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#555', fontWeight: 'bold' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </td>
              <td style={{ padding: '0.5rem', fontWeight: i < 3 ? 'bold' : 'normal' }}>{s.name}</td>
              <td style={{ padding: '0.5rem', color: '#888', fontSize: '0.82rem' }}>{s.team}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold', color: theme.primary, fontSize: '1.1rem' }}>{s.goals}</td>
              <td style={{ textAlign: 'center', color: '#666' }}>{s.penalties || 0}</td>
              <td style={{ textAlign: 'center', color: '#f87171' }}>{s.ownGoals || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
