import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getNbaStandings } from '../../services/api';
import ErrorState from '../ErrorState';

export default function NbaStandings({ theme }) {
  const { data, loading, error, refetch } = useFetch(() => getNbaStandings(), 10 * 60_000);
  const conferences = Array.isArray(data?.conferences) ? data.conferences : [];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NBA-Tabelle...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='📊' />;

  const fmt = n => (n === null || n === undefined || Number.isNaN(Number(n))) ? '-' : Number(n).toFixed(3).replace(/^0/, '');

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', color: theme.primary, fontSize: '1.05rem' }}>🏀 NBA – Tabellen</h2>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 0.9rem' }}>
        Sortiert nach Quote (%). Saison 2026/27 startet am 30.09.2026 – aktuell wird das Ergebnis der letzten Saison gezeigt.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {conferences.map(conf => (
          <div key={conf.name} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.8rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: theme.primary }}>{conf.name}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'right' }}>
                  <th style={{ textAlign: 'left', padding: '0.3rem' }}>#</th>
                  <th style={{ textAlign: 'left' }}>Team</th><th>PG</th><th>%</th><th>GB</th><th>Diff</th><th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {conf.teams.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <td style={{ color: '#666', padding: '0.3rem 0.2rem' }}>{i + 1}</td>
                    <td style={{ textAlign: 'left' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {t.logo ? <img src={t.logo} alt='' style={{ height: '18px', width: '18px', objectFit: 'contain' }} /> : null}
                        <span>{t.abbrev}</span>
                        <small style={{ color: '#666' }}>{t.name}</small>
                      </span>
                    </td>
                    <td>{t.wins}-{t.losses}</td>
                    <td style={{ color: theme.primary, fontWeight: 'bold' }}>{fmt(t.pct)}</td>
                    <td>{t.gb || '-'}</td>
                    <td>{t.diff >= 0 ? '+' : ''}{Math.round(t.diff)}</td>
                    <td>{t.streak}</td>
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
