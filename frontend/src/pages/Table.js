import React, { useEffect, useState } from 'react';

export default function Table({ theme }) {
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games/bl1/table')
      .then(r => r.json())
      .then(d => { setTable(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Tabelle...</p>;

  return (
    <div>
      <h2 style={{ color: theme.primary }}>Bundesliga Tabelle 2025/26</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'center' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>#</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Verein</th>
            <th>Sp</th><th>S</th><th>U</th><th>N</th>
            <th>Tore</th><th>Diff</th>
            <th style={{ color: theme.primary }}>Pkt</th>
          </tr>
        </thead>
        <tbody>
          {table.map((t, i) => (
            <tr key={i} style={{
              borderBottom: '1px solid #1a1a1a',
              background: i < 4 ? 'rgba(74,222,128,0.04)' : i > 14 ? 'rgba(248,113,113,0.04)' : 'transparent'
            }}>
              <td style={{ padding: '0.5rem', color: i < 4 ? '#4ade80' : i > 14 ? '#f87171' : '#aaa', fontWeight: 'bold' }}>{i + 1}</td>
              <td style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t.teamIconUrl && <img src={t.teamIconUrl} alt='' style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                {t.teamName}
              </td>
              <td style={{ textAlign: 'center', color: '#888' }}>{t.matches}</td>
              <td style={{ textAlign: 'center', color: '#4ade80' }}>{t.won}</td>
              <td style={{ textAlign: 'center', color: '#facc15' }}>{t.draw}</td>
              <td style={{ textAlign: 'center', color: '#f87171' }}>{t.lost}</td>
              <td style={{ textAlign: 'center', color: '#888' }}>{t.goals}:{t.opponentGoals}</td>
              <td style={{ textAlign: 'center', color: t.goalDiff > 0 ? '#4ade80' : '#f87171' }}>{t.goalDiff > 0 ? '+' : ''}{t.goalDiff}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold', color: theme.primary }}>{t.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#444' }}>
        <span style={{ color: '#4ade80' }}>■</span> Champions League &nbsp;
        <span style={{ color: '#f87171' }}>■</span> Abstieg
      </div>
    </div>
  );
}
