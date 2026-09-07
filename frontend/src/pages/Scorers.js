import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLeagueSeason } from '../hooks/useLeagueSeason';
import { getScorers, getAssists } from '../services/api';
import ErrorState from '../components/ErrorState';
import LeagueUnavailable from '../components/LeagueUnavailable';
import CsvButton from '../components/CsvButton';
import PdfButton from '../components/PdfButton';
import { leagueLabel, leagueSource, seasonLabel } from '../leagues';

const GOAL_COLUMNS = [
  { key: 'rank',     label: 'Platz' },
  { key: 'name',     label: 'Spieler' },
  { key: 'team',     label: 'Verein' },
  { key: 'goals',    label: 'Tore' },
  { key: 'penalties', label: 'Elfmeter' },
  { key: 'ownGoals', label: 'Eigentore' },
];
const ASSIST_COLUMNS = [
  { key: 'rank',     label: 'Platz' },
  { key: 'name',     label: 'Spieler' },
  { key: 'team',     label: 'Verein' },
  { key: 'assists',  label: 'Vorlagen' },
];

function RankTable({ data, valueKey, valueLabel, icon, theme, loading, error, refetch, emptyMsg }) {
  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>⏳ Lade...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon={icon} />;
  if (!data.length) return <p style={{ color: '#555', textAlign: 'center', marginTop: '2rem' }}>{emptyMsg}</p>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
      <thead>
        <tr style={{ color: '#555', borderBottom: '1px solid #222', textAlign: 'center' }}>
          <th style={{ textAlign: 'left', padding: '0.5rem', width: '2.5rem' }}>#</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Spieler</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Verein</th>
          <th style={{ padding: '0.5rem' }}>{icon} {valueLabel}</th>
          {valueKey === 'goals' && <th style={{ padding: '0.5rem' }}>Elfmeter</th>}
          {valueKey === 'goals' && <th style={{ padding: '0.5rem' }}>Eigentore</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((s, i) => (
          <tr key={i}
            style={{ borderBottom: '1px solid #111', background: i < 3 ? 'rgba(250,204,21,0.04)' : 'transparent', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.background = i < 3 ? 'rgba(250,204,21,0.04)' : 'transparent'}
          >
            <td style={{ padding: '0.5rem 0.5rem 0.5rem 0.8rem', color: '#555', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </td>
            <td style={{ padding: '0.5rem', fontWeight: i < 3 ? 'bold' : 'normal', color: i < 3 ? '#fff' : '#ccc' }}>{s.name}</td>
            <td style={{ padding: '0.5rem', color: '#666', fontSize: '0.8rem' }}>{s.team}</td>
            <td style={{ textAlign: 'center', fontWeight: 'bold', color: theme.primary, fontSize: '1.15rem', padding: '0.5rem' }}>{s[valueKey]}</td>
            {valueKey === 'goals' && <td style={{ textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>{s.penalties || 0}</td>}
            {valueKey === 'goals' && <td style={{ textAlign: 'center', color: '#f87171', fontSize: '0.85rem' }}>{s.ownGoals || 0}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Scorers({ theme, league }) {
  const [tab, setTab] = useState('goals');

  // Lazy: nur den aktiven Tab fetchen
  const scorersFetch = useFetch(() => getScorers(league),  null, [tab === 'goals', league]);
  const assistsFetch = useFetch(() => getAssists(league),  null, [tab === 'assists', league]);

  const scorers = Array.isArray(scorersFetch.data) ? scorersFetch.data : [];
  const assists = Array.isArray(assistsFetch.data) ? assistsFetch.data : [];
  const season  = useLeagueSeason(league);

  if (leagueSource(league) !== 'openligadb') return <LeagueUnavailable league={league} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ color: theme.primary, margin: 0 }}>🏆 Statistiken {season.label} – {leagueLabel(league)}</h2>
        {tab === 'goals'
          ? <>
            <PdfButton title={`Torjäger ${leagueLabel(league)} ${season.label}`} columns={GOAL_COLUMNS}
              rows={scorers.map((s, i) => ({ rank: i + 1, ...s }))} theme={theme} />
            <CsvButton filename={`toerjaeger_${league}_${season.fileName}.csv`} columns={GOAL_COLUMNS}
              rows={scorers.map((s, i) => ({ rank: i + 1, ...s }))} theme={theme} />
          </>
          : <>
            <PdfButton title={`Vorlagen ${leagueLabel(league)} ${season.label}`} columns={ASSIST_COLUMNS}
              rows={assists.map((s, i) => ({ rank: i + 1, ...s }))} theme={theme} />
            <CsvButton filename={`vorlagen_${league}_${season.fileName}.csv`} columns={ASSIST_COLUMNS}
              rows={assists.map((s, i) => ({ rank: i + 1, ...s }))} theme={theme} />
          </>
        }
      </div>
      {!season.isCurrent && (
        <p style={{ fontSize: '0.75rem', color: '#dca500', background: '#1f1c0e', border: '1px solid #3a3314', borderRadius: '8px', padding: '0.5rem 0.8rem', marginBottom: '1rem' }}>
          ⚠️ Für diese Liga ist in der Datenquelle noch keine Saison {seasonLabel()} verfügbar – angezeigt wird die letzte abgeschlossene Saison <strong>{season.label}</strong>. Sobald die neue Saison beginnt, erscheint sie hier automatisch.
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
        {[{ id: 'goals', label: '⚽ Torjäger' }, { id: 'assists', label: '🤝 Vorlagen' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? theme.primary : 'transparent',
            color: tab === t.id ? '#fff' : '#555',
            border: `1px solid ${tab === t.id ? theme.primary : '#333'}`,
            borderRadius: '6px', padding: '0.35rem 1rem',
            cursor: 'pointer', fontWeight: tab === t.id ? 'bold' : 'normal',
            fontSize: '0.85rem', transition: 'all 0.15s'
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'goals' && (
        <RankTable
          data={scorers} valueKey='goals' valueLabel='Tore' icon='⚽'
          theme={theme} loading={scorersFetch.loading} error={scorersFetch.error} refetch={scorersFetch.refetch}
          emptyMsg='Keine Torjäger-Daten verfügbar.'
        />
      )}
      {tab === 'assists' && (
        <RankTable
          data={assists} valueKey='assists' valueLabel='Vorlagen' icon='🤝'
          theme={theme} loading={assistsFetch.loading} error={assistsFetch.error} refetch={assistsFetch.refetch}
          emptyMsg='Keine Vorlagen-Daten verfügbar.'
        />
      )}
    </div>
  );
}
