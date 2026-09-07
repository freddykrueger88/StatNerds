import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getF1Schedule, getF1Results, getF1PitStops } from '../../services/api';
import ErrorState from '../ErrorState';

const fDate = iso => {
  try { return iso ? new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''; }
  catch { return iso || ''; }
};

function countdown(date) {
  const diff = new Date(date) - new Date();
  if (Number.isNaN(diff) || diff <= 0) return null;
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  return `${d} d ${h} h ${m} min`;
}

export default function F1Schedule({ theme }) {
  const [round, setRound] = useState(null);
  const { data, loading, error, refetch } = useFetch(() => getF1Schedule(), 60 * 60_000);
  const races = Array.isArray(data?.schedule) ? data.schedule : [];
  const season = data?.season || new Date().getFullYear();

  const res = useFetch(() => (round ? getF1Results(round) : Promise.resolve(null)), null, [round]);

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade F1-Rennkalender...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='🏎️' />;

  const now = new Date();
  const next = races.find(r => new Date(`${r.date}T00:00:00`) >= now) || null;

  return (
    <div>
      <h2 style={{ margin: '0 0 0.5rem', color: theme.primary, fontSize: '1.05rem' }}>
        🏎️ Formel 1 – Rennkalender {season}
      </h2>
      {next && <p style={{ fontSize: '0.75rem', background: '#1a1a1a', borderLeft: `4px solid ${theme.primary}`, borderRadius: '8px', padding: '0.5rem 0.8rem', margin: '0 0 1rem' }}>
        Nächstes Rennen: <strong>{next.name}</strong> ({next.locality}, {next.country}) · {fDate(next.date)} · Countdown: <strong>{countdown(next.date)}</strong>
      </p>}

      {round ? (() => {
        if (res.loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '1.5rem' }}>⏳ Lade Rennresultat...</p>;
        if (res.error)   return <ErrorState message={res.error} onRetry={res.refetch} icon='🏎️' />;
        const r = res.data;
        return (
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '0.9rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <strong style={{ color: theme.primary }}>{r.race?.name} – Ergebnis</strong>
              <button onClick={() => setRound(null)} style={{ background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`, borderRadius: '6px', padding: '0.2rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem' }}>← Kalender</button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: '0.6rem' }}>
              {r.race?.locality}, {r.race?.country} · {fDate(r.race?.date)} · {r.race?.circuit} ⚡ Schnellste Runde: {r.race && r.results?.find(x => x.fastestLap)?.driver?.name} ({r.results?.find(x => x.fastestLap)?.fastestLapTime})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'right' }}>
                  <th style={{ textAlign: 'left', padding: '0.3rem' }}>Pos</th><th>Start</th><th style={{ textAlign: 'left' }}>Fahrer</th><th style={{ textAlign: 'left' }}>Team</th><th>Pkt</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(r.results || []).map(row => (
                  <tr key={row.pos} style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <td style={{ color: theme.primary, fontWeight: 'bold', padding: '0.3rem 0.2rem' }}>{row.pos}</td>
                    <td style={{ color: '#666' }}>{row.grid}</td>
                    <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{row.driver.name}{row.fastestLap ? ' ⚡' : ''}</td>
                    <td style={{ textAlign: 'left', color: '#777' }}>{row.team}</td>
                    <td style={{ color: theme.primary, fontWeight: 'bold' }}>{row.points}</td>
                    <td style={{ color: '#555', fontSize: '0.72rem' }}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {round && <div style={{ marginTop: '0.6rem', fontSize: '0.8rem' }}><strong style={{ color: theme.primary }}>Boxenstopps</strong></div>}
            {round && <PitStops theme={theme} round={round} />}
          </div>
        );
      })() : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem' }}>
          {races.map(r => {
            const done = new Date(`${r.date}T00:00:00`) < now;
            return (
              <button key={r.round} onClick={() => setRound(r.round)} title={`Ergebnis ansehen: ${r.name}`} disabled={!done} style={{
                background: '#1a1a1a', border: `1px solid ${done ? '#333' : '#1f1f1f'}`, borderRadius: '12px', padding: '0.7rem 0.8rem',
                textAlign: 'left', cursor: done ? 'pointer' : 'default', color: done ? '#eee' : '#777',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666' }}>
                  <span>Runde {r.round}</span>
                  <span>{done ? '✔ Ergebnis' : 'Geplant'}</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: '0.25rem 0' }}>{r.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>{r.locality}, {r.country} · {fDate(r.date)}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PitStops({ theme, round }) {
  const { data, loading } = useFetch(() => getF1PitStops(round), 60 * 60_000, [round]);
  const stops = Array.isArray(data?.stops) ? data.stops : [];
  if (loading) return <p style={{ color: '#666', fontSize: '0.75rem' }}>⏳ Lade Boxenstopps...</p>;
  if (!stops.length) return <p style={{ color: '#888', fontSize: '0.75rem' }}>Keine Boxenstopp-Daten.</p>;
  const dur = d => (/^\d+(\.\d+)?$/.test(d) ? `${d}s` : (/^[\d:]+\.\d+$/.test(d) ? d : '—'));
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginTop: '0.3rem' }}>
      <thead><tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'right' }}>
        <th style={{ textAlign: 'left', padding: '0.2rem' }}>Fahrer</th><th>Stop</th><th>Runde</th><th>Dauer</th>
      </tr></thead>
      <tbody>
        {stops.slice(0, 12).map((s, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #1f1f1f' }}>
            <td style={{ textAlign: 'left', padding: '0.2rem' }}>{s.driverId || s.number}</td>
            <td>{s.stop}</td><td>{s.lap}</td><td>{dur(s.duration)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
