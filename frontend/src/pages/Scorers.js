import React, { useEffect, useState } from 'react';

function RankTable({ data, valueKey, valueLabel, icon, theme, loading, emptyMsg }) {
  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>⏳ Lade...</p>;
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
          <tr key={i} style={{ borderBottom: '1px solid #111', background: i < 3 ? 'rgba(250,204,21,0.04)' : 'transparent', transition: 'background 0.15s' }}
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

export default function Scorers({ theme }) {
  const [tab, setTab] = useState('goals');
  const [scorers, setScorers] = useState([]);
  const [assists, setAssists] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingAssists, setLoadingAssists] = useState(false);
  const [assistsLoaded, setAssistsLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/games/bl1/scorers')
      .then(r => r.json())
      .then(d => { setScorers(Array.isArray(d) ? d : []); setLoadingGoals(false); })
      .catch(() => setLoadingGoals(false));
  }, []);

  const loadAssists = () => {
    if (assistsLoaded) return;
    setLoadingAssists(true);
    fetch('/api/games/bl1/assists')
      .then(r => r.json())
      .then(d => { setAssists(Array.isArray(d) ? d : []); setLoadingAssists(false); setAssistsLoaded(true); })
      .catch(() => setLoadingAssists(false));
  };

  const switchTab = (t) => {
    setTab(t);
    if (t === 'assists') loadAssists();
  };

  return (
    <div>
      <h2 style={{ color: theme.primary, marginBottom: '0.8rem' }}>🏆 Bundesliga 2025/26</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
        {[{ id: 'goals', label: '⚽ Torjäger' }, { id: 'assists', label: '🤝 Vorlagen' }].map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
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
          theme={theme} loading={loadingGoals}
          emptyMsg='Keine Torjäger-Daten verfügbar.'
        />
      )}
      {tab === 'assists' && (
        <RankTable
          data={assists} valueKey='assists' valueLabel='Vorlagen' icon='🤝'
          theme={theme} loading={loadingAssists}
          emptyMsg='Keine Vorlagen-Daten verfügbar. (OpenLigaDB liefert Vorlagen wenn übermittelt)'
        />
      )}
    </div>
  );
}
