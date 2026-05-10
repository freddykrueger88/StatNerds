import React, { useEffect, useState } from 'react';
import Games from './pages/Games';
import Table from './pages/Table';
import Scorers from './pages/Scorers';
import Teams from './pages/Teams';
import TeamStats from './pages/TeamStats';
import Settings from './pages/Settings';

const DEFAULT_THEME = { name: 'Bundesliga', primary: '#E32221', secondary: '#000000' };

export default function App() {
  const [view, setView] = useState('games');
  const [health, setHealth] = useState(null);
  const [theme, setTheme] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sn_theme')) || DEFAULT_THEME; }
    catch { return DEFAULT_THEME; }
  });

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(d => setHealth(d.status)).catch(() => setHealth('Fehler'));
  }, []);

  const nav = [
    { id: 'games',     label: '⚽ Spiele' },
    { id: 'table',     label: '📊 Tabelle' },
    { id: 'scorers',   label: '🥅 Statistiken' },
    { id: 'teamstats', label: '📊 Vereine' },
    { id: 'teams',     label: '🏟️ Info' },
    { id: 'settings',  label: '⚙️' },
  ];

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#0f0f0f', color: '#fff', minHeight: '100vh' }}>
      <nav style={{
        background: '#1a1a1a',
        borderBottom: `2px solid ${theme.primary}`,
        padding: '0.7rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap'
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginRight: '0.5rem', color: theme.primary }}>📊 StatNerds</span>
        {nav.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            background: view === n.id ? theme.primary : 'transparent',
            color: view === n.id ? '#fff' : '#888',
            border: 'none', borderRadius: '6px',
            padding: '0.35rem 0.75rem', cursor: 'pointer',
            fontWeight: view === n.id ? 'bold' : 'normal', fontSize: '0.85rem'
          }}>{n.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: health === 'OK' ? '#4ade80' : '#f87171' }}>⬤ {health || '...'}</span>
      </nav>

      <div style={{ padding: '1rem', maxWidth: '960px', margin: '0 auto' }}>
        {view === 'games'     && <Games     theme={theme} />}
        {view === 'table'     && <Table     theme={theme} />}
        {view === 'scorers'   && <Scorers   theme={theme} />}
        {view === 'teamstats' && <TeamStats  theme={theme} />}
        {view === 'teams'     && <Teams     theme={theme} />}
        {view === 'settings'  && <Settings  theme={theme} setTheme={setTheme} />}
      </div>
    </div>
  );
}
