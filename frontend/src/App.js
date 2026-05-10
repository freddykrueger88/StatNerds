import React, { useEffect, useState } from 'react';
import Games from './pages/Games';
import Table from './pages/Table';
import Scorers from './pages/Scorers';
import Teams from './pages/Teams';
import TeamStats from './pages/TeamStats';
import Settings from './pages/Settings';
import NotificationToggle from './components/NotificationToggle';

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
    { id: 'games',     label: '⚽',   full: 'Spiele' },
    { id: 'table',     label: '📊',   full: 'Tabelle' },
    { id: 'scorers',   label: '🥅',   full: 'Stats' },
    { id: 'teamstats', label: '📞',   full: 'Vereine' },
    { id: 'teams',     label: '🏟️',  full: 'Info' },
    { id: 'settings',  label: '⚙️',  full: '' },
  ];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#0f0f0f', color: '#fff', minHeight: '100dvh' }}>
      <nav style={{
        background: '#1a1a1a', borderBottom: `2px solid ${theme.primary}`,
        padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '0.2rem', color: theme.primary, whiteSpace: 'nowrap' }}>📊 StatNerds</span>
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1, flexWrap: 'wrap' }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              background: view === n.id ? theme.primary : 'transparent',
              color: view === n.id ? '#fff' : '#666',
              border: 'none', borderRadius: '6px',
              padding: '0.3rem 0.55rem', cursor: 'pointer',
              fontWeight: view === n.id ? 'bold' : 'normal', fontSize: '0.82rem'
            }}>
              <span>{n.label}</span>
              {n.full && <span className='nav-label' style={{ marginLeft: '0.2rem' }}>{n.full}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <NotificationToggle theme={theme} />
          <span style={{ fontSize: '0.65rem', color: health === 'OK' ? '#4ade80' : '#f87171' }}>⬤ {health || '...'}</span>
        </div>
      </nav>

      <div style={{ padding: '0.75rem', maxWidth: '960px', margin: '0 auto', paddingBottom: '5rem' }}>
        {view === 'games'     && <Games     theme={theme} />}
        {view === 'table'     && <Table     theme={theme} />}
        {view === 'scorers'   && <Scorers   theme={theme} />}
        {view === 'teamstats' && <TeamStats  theme={theme} />}
        {view === 'teams'     && <Teams     theme={theme} />}
        {view === 'settings'  && <Settings  theme={theme} setTheme={setTheme} />}
      </div>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a', borderTop: `2px solid ${theme.primary}`,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '0.4rem 0 calc(0.4rem + env(safe-area-inset-bottom))',
        zIndex: 200,
      }} className='mobile-bottom-nav'>
        {nav.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            padding: '0.3rem 0.5rem', minWidth: '44px', minHeight: '44px',
            color: view === n.id ? theme.primary : '#555',
          }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{n.label}</span>
            {n.full && <span style={{ fontSize: '0.52rem', fontWeight: view === n.id ? 'bold' : 'normal' }}>{n.full}</span>}
          </button>
        ))}
      </nav>

      <style>{`
        @media (min-width: 600px) { .mobile-bottom-nav { display: none !important; } }
        @media (max-width: 599px) { .nav-label { display: none; } }
      `}</style>
    </div>
  );
}
