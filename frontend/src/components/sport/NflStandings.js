import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getNflStandings } from '../../services/api';
import ErrorState from '../ErrorState';

function fmtPct(v) {
  if (v === null || v === undefined) return '-';
  const n = parseFloat(v);
  if (!isFinite(n)) return v;
  return (n * 100).toFixed(1).replace(/\.0$/, '') + '%';
}

function TeamRow({ t, theme }) {
  const gb = t.gb && t.gb !== 0 && t.gb !== '0' ? `+${t.gb}` : '';
  return (
    <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
      <td style={{ padding: '0.45rem 0.3rem', textAlign: 'center', color: '#aaa', fontWeight: t.playoffSeed ? 'bold' : 'normal' }}>
        {t.playoffSeed || '-'}
      </td>
      <td style={{ padding: '0.45rem 0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {t.logo ? <img src={t.logo} alt='' style={{ width: '22px', height: '22px', objectFit: 'contain' }} /> : <span style={{ width: '22px' }} />}
          {t.name}
        </div>
      </td>
      <td style={{ textAlign: 'center', color: '#888' }}>{t.wins}-{t.losses}{t.ties ? `-${t.ties}` : ''}</td>
      <td style={{ textAlign: 'center', color: '#888' }}>{fmtPct(t.pct)}</td>
      <td style={{ textAlign: 'center', color: '#888' }}>{gb || '-'}</td>
      <td style={{ textAlign: 'center', color: '#888' }}>{t.diff > 0 ? `+${t.diff}` : t.diff}</td>
      <td style={{ textAlign: 'center', color: '#888' }}>{t.pointsFor}-{t.pointsAgainst}</td>
      <td style={{ textAlign: 'center', color: '#aaa' }}>{t.streak || '-'}</td>
    </tr>
  );
}

export default function NflStandings({ theme }) {
  const { data, loading, error, refetch } = useFetch(() => getNflStandings(), 10 * 60_000);
  const conferences = Array.isArray(data?.conferences) ? data.conferences : [];

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade NFL-Standings...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏈' />;

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: '0.5rem', color: theme.primary, fontSize: '1.05rem' }}>🏈 NFL – Standings & Playoff-Bild</h2>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 1rem' }}>
        AFC/NFC-Konferenzstände. Seed zeigt die aktuelle Playoff-Position.
      </p>
      {conferences.map(conf => {
        const hasZones = (conf.zones || []).length > 0;
        const zones = hasZones ? conf.zones : [{ name: 'Konferenz', teams: conf.teams || [] }];
        return (
          <div key={conf.name} style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.4rem', color: theme.primary, fontSize: '0.95rem' }}>{conf.name}</h3>
            {zones.map(z => (
              <div key={z.name} style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.25rem' }}>{z.name}</div>
                <div style={{ overflowX: 'auto', background: '#16161e', borderRadius: '10px', padding: '0.3rem 0.6rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'center' }}>
                        <th style={{ padding: '0.4rem 0.3rem' }}>Seed</th>
                        <th style={{ textAlign: 'left', padding: '0.4rem 0.3rem' }}>Team</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>S-N-U</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>%</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>GB</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>Diff</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>PF-PA</th>
                        <th style={{ padding: '0.4rem 0.2rem' }}>Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(z.teams || []).map(t => <TeamRow key={t.id || t.abbrev} t={t} theme={theme} />)}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {!conferences.length && <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>Keine Standings-Daten verfügbar.</p>}
    </div>
  );
}
