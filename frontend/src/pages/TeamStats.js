import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLeagueSeason } from '../hooks/useLeagueSeason';
import { getTeamStats, getTeamForm } from '../services/api';
import ErrorState from '../components/ErrorState';
import LeagueUnavailable from '../components/LeagueUnavailable';
import CsvButton from '../components/CsvButton';
import PdfButton from '../components/PdfButton';
import FormChart from '../components/FormChart';
import { leagueLabel, leagueSource, seasonLabel } from '../leagues';

const SORT_OPTIONS = [
  { key: 'wins',        label: '🏆 Siege'        },
  { key: 'goals',       label: '⚽ Tore'           },
  { key: 'goalDiff',    label: '📈 Tordiff.'      },
  { key: 'cleanSheets', label: '🧤 Clean Sheets'  },
  { key: 'avgGoals',    label: '📊 Ø Tore/Spiel'  },
  { key: 'winRate',     label: '% Siegquote'      },
];

const CSV_COLUMNS = [
  { key: 'teamName',   label: 'Verein' },
  { key: 'wins',       label: 'Siege' },
  { key: 'draws',      label: 'Unentschieden' },
  { key: 'losses',     label: 'Niederlagen' },
  { key: 'goals',      label: 'Tore' },
  { key: 'cleanSheets', label: 'Clean Sheets' },
  { key: 'avgGoals',   label: 'Tore pro Spiel' },
];

export default function TeamStats({ theme, league }) {
  const [sortKey, setSortKey] = useState('wins');
  const [selected, setSelected] = useState(null);
  const { data, loading, error, refetch } = useFetch(() => getTeamStats(league), null, [league]);
  const season = useLeagueSeason(league);
  const form = useFetch(() => (selected ? getTeamForm(league, selected) : Promise.resolve(null)), null, [league, selected]);

  if (leagueSource(league) !== 'openligadb') return <LeagueUnavailable league={league} />;

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Vereinsstatistiken...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='📈' />;

  const teams = Array.isArray(data) ? [...data].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)) : [];
  const formGames = form.data?.games || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary }}>📈 Vereinsstatistiken – {season.label}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <PdfButton title={`Vereinsstatistiken ${leagueLabel(league)} ${season.label}`} columns={CSV_COLUMNS}
            rows={teams.map(t => ({ ...t, avgGoals: t.avgGoals != null ? t.avgGoals.toFixed(2) : '' }))} theme={theme} />
          <CsvButton filename={`vereinsstatistiken_${league}_${season.fileName}.csv`} columns={CSV_COLUMNS}
            rows={teams.map(t => ({ ...t, avgGoals: t.avgGoals != null ? t.avgGoals.toFixed(2) : '' }))} theme={theme} />
          <select value={sortKey} onChange={e => setSortKey(e.target.value)}
            style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </div>
      {selected && (
        <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>⭐ {selected}</span>
            <button onClick={() => setSelected(null)}
              style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: '5px', padding: '0.1rem 0.55rem', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
          </div>
          {form.loading && <p style={{ color: '#666', fontSize: '0.8rem' }}>⏳ Formkurve wird geladen…</p>}
          {form.error && <p style={{ color: '#f87171', fontSize: '0.78rem' }}>Formkurve nicht verfügbar: {form.error}</p>}
          {formGames.length > 0 && <FormChart games={formGames} team={selected} theme={theme} />}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {teams.map((t, i) => (
          <div key={i} onClick={() => setSelected(t.teamName)}
            style={{ background: '#1a1a1a', borderRadius: '10px', padding: '1rem', borderLeft: `3px solid ${i < 3 ? theme.primary : '#333'}`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              {t.teamIconUrl && <img src={t.teamIconUrl} alt='' style={{ width: '24px', height: '24px', objectFit: 'contain' }} />}
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{t.teamName}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', fontSize: '0.78rem' }}>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#4ade80', fontWeight: 'bold' }}>{t.wins}</div><div style={{ color: '#444' }}>Siege</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#facc15', fontWeight: 'bold' }}>{t.draws}</div><div style={{ color: '#444' }}>Unentsch.</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: '#f87171', fontWeight: 'bold' }}>{t.losses}</div><div style={{ color: '#444' }}>Niederl.</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ color: theme.primary, fontWeight: 'bold' }}>{t.goals}</div><div style={{ color: '#444' }}>Tore</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 'bold', color: '#aaa' }}>{t.cleanSheets || 0}</div><div style={{ color: '#444' }}>Clean Sh.</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 'bold', color: '#aaa' }}>{t.avgGoals?.toFixed(1) || '–'}</div><div style={{ color: '#444' }}>Ø Tore</div></div>
            </div>
            {t.form && (
              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '3px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {t.form.slice(-5).split('').map((f, j) => (
                    <span key={j} style={{ background: f === 'W' ? '#4ade80' : f === 'D' ? '#facc15' : '#f87171', color: '#000', borderRadius: '3px', padding: '1px 4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{f === 'W' ? 'S' : f === 'D' ? 'U' : 'N'}</span>
                  ))}
                </div>
                <span style={{ fontSize: '0.62rem', color: '#555' }}>Klicken → Formkurve 📈</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
