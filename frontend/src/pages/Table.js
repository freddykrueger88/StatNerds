import React from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLeagueSeason } from '../hooks/useLeagueSeason';
import { getTable } from '../services/api';
import ErrorState from '../components/ErrorState';
import LeagueUnavailable from '../components/LeagueUnavailable';
import CsvButton from '../components/CsvButton';
import PdfButton from '../components/PdfButton';
import NbaStandings from '../components/sport/NbaStandings';
import NflStandings from '../components/sport/NflStandings';
import TennisRankings from '../components/sport/TennisRankings';
import NhlStandings from '../components/sport/NhlStandings';
import F1Standings from '../components/sport/F1Standings';
import { leagueLabel, leagueSource, seasonLabel } from '../leagues';

const CSV_COLUMNS = [
  { key: 'rank',        label: 'Platz' },
  { key: 'teamName',    label: 'Verein' },
  { key: 'matches',     label: 'Spiele' },
  { key: 'won',         label: 'Siege' },
  { key: 'draw',        label: 'Unentschieden' },
  { key: 'lost',        label: 'Niederlagen' },
  { key: 'goals',       label: 'Tore' },
  { key: 'opponentGoals', label: 'Gegentore' },
  { key: 'goalDiff',    label: 'Tordifferenz' },
  { key: 'points',      label: 'Punkte' },
];

export default function Table({ theme, league }) {
  const { data, loading, error, refetch } = useFetch(() => getTable(league), null, [league]);
  const table = Array.isArray(data) ? data : [];
  const season = useLeagueSeason(league);

  const source = leagueSource(league);
  if (league === 'nfl') return <NflStandings theme={theme} />;
  if (source === 'espn') {
    if (league === 'nba') return <NbaStandings theme={theme} />;
    return <TennisRankings theme={theme} league={league} />;
  }
  if (source === 'nhl') return <NhlStandings theme={theme} />;
  if (source === 'f1')  return <F1Standings theme={theme} />;
  if (source !== 'openligadb') return <LeagueUnavailable league={league} />;

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Tabelle...</p>;
  if (error)   return <ErrorState message={error} onRetry={refetch} icon='📊' />;

  const excelRows = table.map((t, i) => ({ rank: i + 1, ...t }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ color: theme.primary, margin: 0 }}>Ligatabelle {season.label} – {leagueLabel(league)}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <PdfButton title={`Ligatabelle ${leagueLabel(league)} ${season.label}`} columns={CSV_COLUMNS} rows={excelRows} theme={theme} />
          <CsvButton filename={`tabelle_${league}_${season.fileName}.csv`} columns={CSV_COLUMNS} rows={excelRows} theme={theme} />
        </div>
      </div>
      {!season.isCurrent && (
        <p style={{ fontSize: '0.75rem', color: '#dca500', background: '#1f1c0e', border: '1px solid #3a3314', borderRadius: '8px', padding: '0.5rem 0.8rem', marginBottom: '1rem' }}>
          ⚠️ Für diese Liga ist in der Datenquelle noch keine Saison {seasonLabel()} verfügbar – angezeigt wird die letzte abgeschlossene Saison <strong>{season.label}</strong>. Sobald die neue Saison beginnt, erscheint sie hier automatisch.
        </p>
      )}
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
          {table.map((t, i) => {
            const promo = league === 'bl2' ? i < 3 : league === 'fbl1' ? i < 2 : i < 4;
            const releg = league === 'fbl1' ? i >= 12 : i > 14;
            return (
            <tr key={i} style={{
              borderBottom: '1px solid #1a1a1a',
              background: promo ? 'rgba(74,222,128,0.04)' : releg ? 'rgba(248,113,113,0.04)' : 'transparent'
            }}>
              <td style={{ padding: '0.5rem', color: promo ? '#4ade80' : releg ? '#f87171' : '#aaa', fontWeight: 'bold' }}>
                {i + 1}
                {promo && <span aria-hidden='true' style={{ marginLeft: '0.2rem', fontSize: '0.7rem' }}>▲</span>}
                {releg && <span aria-hidden='true' style={{ marginLeft: '0.2rem', fontSize: '0.7rem' }}>▼</span>}
              </td>
              <td style={{ padding: '0.5rem' }}>
                {/* Wrapper-div nötig – td darf kein flex-Container sein */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {t.teamIconUrl && <img src={t.teamIconUrl} alt='' style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                  {t.teamName}
                </div>
              </td>
              <td style={{ textAlign: 'center', color: '#888' }}>{t.matches}</td>
              <td style={{ textAlign: 'center', color: '#4ade80' }}>{t.won}</td>
              <td style={{ textAlign: 'center', color: '#facc15' }}>{t.draw}</td>
              <td style={{ textAlign: 'center', color: '#f87171' }}>{t.lost}</td>
              <td style={{ textAlign: 'center', color: '#888' }}>{t.goals}:{t.opponentGoals}</td>
              <td style={{ textAlign: 'center', color: t.goalDiff > 0 ? '#4ade80' : '#f87171' }}>{t.goalDiff > 0 ? '+' : ''}{t.goalDiff}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold', color: theme.primary }}>{t.points}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#444' }}>
        <span style={{ color: '#4ade80' }}>▲</span>/<span style={{ color: '#4ade80' }}>■</span> {league === 'bl2' ? 'Aufstieg / Relegation' : league === 'fbl1' ? 'Champions League' : 'Champions League'} &nbsp;
        <span style={{ color: '#f87171' }}>▼</span>/<span style={{ color: '#f87171' }}>■</span> Abstieg
      </div>
    </div>
  );
}
