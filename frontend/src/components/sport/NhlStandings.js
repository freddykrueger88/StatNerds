import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getNhlStandings } from '../../services/api';
import ErrorState from '../ErrorState';
import DelNotice from './DelNotice';

export default function NhlStandings({ theme }) {
  const { data, loading, error, refetch } = useFetch(() => getNhlStandings(), 10 * 60_000);
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const confs = ['Eastern', 'Western'];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NHL-Tabelle...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏒' />;

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', color: theme.primary, fontSize: '1.05rem' }}>🏒 NHL – Tabellen</h2>
      <DelNotice theme={theme} />
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 0.9rem' }}>
        Aktuell steht die Offseason – gezeigt wird der Stand am Ende der Saison 2025/26. Nach Saisonstart 2026/27 wird er automatisch aktuell.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        {confs.map(conf => (
          <div key={conf} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.8rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: theme.primary }}>{conf} Conference</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'right' }}>
                  <th style={{ textAlign: 'left', padding: '0.3rem' }}>#</th>
                  <th style={{ textAlign: 'left' }}>Team</th><th>SP</th><th>S</th><th>N</th><th>OT</th><th>Pkt</th><th>Diff</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter(r => r.conference === conf).map((r, i) => (
                  <tr key={r.team.abbrev || i} style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <td style={{ color: '#666', padding: '0.3rem 0.2rem' }}>{i + 1}</td>
                    <td style={{ textAlign: 'left' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {r.team.logo ? <img src={r.team.logo} alt='' style={{ height: '18px', width: '18px', objectFit: 'contain' }} /> : null}
                        <span>{r.team.abbrev}</span>
                        <small style={{ color: '#666' }}>{r.team.name}</small>
                      </span>
                    </td>
                    <td>{r.gp}</td>
                    <td>{r.wins}</td>
                    <td>{r.losses}</td>
                    <td>{r.ot}</td>
                    <td style={{ color: theme.primary, fontWeight: 'bold' }}>{r.points}</td>
                    <td>{r.runDiff >= 0 ? '+' : ''}{r.runDiff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
