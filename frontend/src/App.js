import React, { useEffect, useState } from 'react';
import Games from './pages/Games';
import Table from './pages/Table';
import Settings from './pages/Settings';

export default function App() {
  const [view, setView] = useState('games');
  const [health, setHealth] = useState(null);
  const [theme, setTheme] = useState(() => JSON.parse(localStorage.getItem('sn_theme') || '{"primary":"#4ade80","name":"Standard"}'));

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(d => setHealth(d.status)).catch(() => setHealth('Fehler'));
  }, []);

  const nav = [
    { id: 'games', label: '⚽ Spiele' },
    { id: 'table', label: '📊 Tabelle' },
    { id: 'settings', label: '⚙️ Einstellungen' },
  ];

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#0f0f0f', color: '#fff', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{ background: '#1a1a1a', borderBottom: `2px solid ${theme.primary}`, padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', marginRight: '1rem' }}>📊 StatNerds</span>
        {nav.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            background: view === n.id ? theme.primary : 'transparent',
            color: view === n.id ? '#000' : '#aaa',
            border: 'none', borderRadius: '6px', padding: '0.4rem 0.9rem',
            cursor: 'pointer', fontWeight: view === n.id ? 'bold' : 'normal', fontSize: '0.9rem'
          }}>{n.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: health === 'OK' ? '#4ade80' : '#f87171' }}>⬤ {health || '...'}</span>
      </nav>

      {/* Content */}
      <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'games' && <Games theme={theme} />}
        {view === 'table' && <Table theme={theme} />}
        {view === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
      </div>
    </div>
  );
}
