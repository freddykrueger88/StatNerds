import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getF1Drivers, getF1Constructors } from '../../services/api';
import ErrorState from '../ErrorState';

export default function F1Standings({ theme }) {
  const season = new Date().getFullYear();
  const drv = useFetch(() => getF1Drivers(season), 30 * 60_000, [season]);
  const ctr = useFetch(() => getF1Constructors(season), 30 * 60_000, [season]);

  if (drv.loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade F1-WM-Stand...</p>;
  if (drv.error)   return <ErrorState message={drv.error} onRetry={drv.refetch} icon='🏎️' />;

  const drivers = Array.isArray(drv.data?.drivers) ? drv.data.drivers : [];
  const constructors = Array.isArray(ctr.data?.constructors) ? ctr.data.constructors : [];

  const medal = i => i === 0 ? '#facc15' : i === 1 ? '#9aa0a6' : i === 2 ? '#b87333' : 'transparent';

  return (
    <div>
      <h2 style={{ margin: '0 0 0.5rem', color: theme.primary, fontSize: '1.05rem' }}>🏎️ Formel 1 – WM-Stand {season}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.8rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: theme.primary }}>Fahrer-WM</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'right' }}>
                <th style={{ textAlign: 'left', padding: '0.3rem' }}>#</th><th style={{ textAlign: 'left' }}>Fahrer</th><th style={{ textAlign: 'left' }}>Team</th><th>Siege</th><th>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, i) => (
                <tr key={d.driver.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                  <td style={{ textAlign: 'left', padding: '0.3rem 0.2rem' }}>
                    {i < 3 ? <span style={{ color: medal(i) }}>●</span> : <span style={{ color: '#666' }}>{d.pos || i + 1}</span>}
                  </td>
                  <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{d.driver.name}</td>
                  <td style={{ textAlign: 'left', color: '#777' }}>{d.team}</td>
                  <td style={{ color: '#888' }}>{d.wins}</td>
                  <td style={{ color: theme.primary, fontWeight: 'bold' }}>{d.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.8rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: theme.primary }}>Konstrukteurs-WM</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'right' }}>
                <th style={{ textAlign: 'left', padding: '0.3rem' }}>#</th><th style={{ textAlign: 'left' }}>Team</th><th>Nation</th><th>Siege</th><th>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((c, i) => (
                <tr key={c.name} style={{ borderBottom: '1px solid #1f1f1f' }}>
                  <td style={{ textAlign: 'left', padding: '0.3rem 0.2rem' }}>
                    {i < 3 ? <span style={{ color: medal(i) }}>●</span> : <span style={{ color: '#666' }}>{c.pos || i + 1}</span>}
                  </td>
                  <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{c.name}</td>
                  <td style={{ color: '#777' }}>{c.nationality}</td>
                  <td style={{ color: '#888' }}>{c.wins}</td>
                  <td style={{ color: theme.primary, fontWeight: 'bold' }}>{c.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
