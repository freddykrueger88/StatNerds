import React, { useState } from 'react';

const APP_VERSION = '0.3.0';
const GITHUB_URL = 'https://github.com/freddykrueger88/StatNerds';

const THEMES = [
  { name: 'Bundesliga', primary: '#E32221', secondary: '#000000' },
  { name: 'Werder Bremen', primary: '#1D9253', secondary: '#FFFFFF' },
  { name: 'FC Bayern', primary: '#ED1C24', secondary: '#FFFFFF' },
  { name: 'BVB Dortmund', primary: '#FCEA10', secondary: '#000000' },
  { name: 'Bayer Leverkusen', primary: '#E32221', secondary: '#000000' },
  { name: 'RB Leipzig', primary: '#DD0741', secondary: '#001E62' },
  { name: 'Schalke 04', primary: '#004D9D', secondary: '#FFFFFF' },
  { name: 'HSV', primary: '#0B1F69', secondary: '#FFFFFF' },
  { name: 'Borussia Mönchengladbach', primary: '#00A550', secondary: '#000000' },
  { name: 'Eintracht Frankfurt', primary: '#E1000F', secondary: '#000000' },
  { name: 'VfB Stuttgart', primary: '#E32221', secondary: '#FFFFFF' },
  { name: 'Werder Bremen', primary: '#1D9253', secondary: '#FFFFFF' },
  { name: 'Nacht (Dark)', primary: '#6366f1', secondary: '#1e1b4b' },
];

const API_KEYS = [
  {
    id: 'api_football',
    label: 'API-Football',
    description: 'Live-Stats, xG, Schiedsrichter, TV-Sender, Spielerinfos',
    placeholder: 'z.B. a1b2c3d4e5f6...',
    url: 'https://dashboard.api-football.com/register',
    urlLabel: 'Kostenlos registrieren (100 Req/Tag)',
    free: true,
  },
  {
    id: 'sportsdb',
    label: 'TheSportsDB',
    description: 'Vereinslogos, Stadionfotos, Spielerbilder, Vereinshistorie',
    placeholder: 'Patreon-Key oder leer lassen für Free-Tier',
    url: 'https://www.thesportsdb.com/api.php',
    urlLabel: 'API-Info & Patreon-Key',
    free: true,
  },
  {
    id: 'football_data',
    label: 'Football-Data.org',
    description: 'Internationale Ligen, Champions League, Premier League',
    placeholder: 'Dein Football-Data API-Key...',
    url: 'https://www.football-data.org/client/register',
    urlLabel: 'Kostenlos registrieren',
    free: true,
  },
  {
    id: 'rapidapi',
    label: 'RapidAPI (Sport)',
    description: 'Zusätzliche Sport-APIs über RapidAPI-Hub',
    placeholder: 'Dein RapidAPI-Key...',
    url: 'https://rapidapi.com/hub',
    urlLabel: 'RapidAPI Hub → Sport-Kategorie',
    free: false,
  },
];

const CLEANUP_OPTIONS = [
  { label: 'Statistiken älter als 7 Tage', days: 7 },
  { label: 'Statistiken älter als 14 Tage', days: 14 },
  { label: 'Statistiken älter als 30 Tage', days: 30 },
  { label: 'Alle gespeicherten Statistiken löschen', days: 0 },
];

export default function Settings({ theme, setTheme }) {
  const [keys, setKeys] = useState(() => {
    const stored = {};
    API_KEYS.forEach(k => { stored[k.id] = localStorage.getItem(`sn_key_${k.id}`) || ''; });
    return stored;
  });
  const [savedMsg, setSavedMsg] = useState({});
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleanupMsg, setCleanupMsg] = useState('');

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('sn_theme', JSON.stringify(t));
  };

  const saveKey = (id) => {
    localStorage.setItem(`sn_key_${id}`, keys[id]);
    setSavedMsg(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setSavedMsg(prev => ({ ...prev, [id]: false })), 2000);
  };

  const handleCleanup = async () => {
    if (!window.confirm(`Wirklich löschen (${cleanupDays === 0 ? 'ALLE' : 'älter als ' + cleanupDays + ' Tage'})?`)) return;
    try {
      const r = await fetch(`/api/stats/cleanup?days=${cleanupDays}`, { method: 'DELETE' });
      const d = await r.json();
      setCleanupMsg(`✅ ${d.deleted} Einträge gelöscht.`);
    } catch {
      setCleanupMsg('❌ Fehler beim Löschen.');
    }
  };

  const block = { background: '#1a1a1a', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' };
  const label = { color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' };

  return (
    <div style={{ maxWidth: '700px', paddingBottom: '3rem' }}>
      <h2 style={{ color: theme.primary }}>⚙️ Einstellungen</h2>

      {/* Theme */}
      <div style={block}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>🎨 Theme / Vereinsfarben</h3>
        <span style={label}>Aktiv: <strong style={{ color: theme.primary }}>{theme.name}</strong></span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem' }}>
          {THEMES.filter((t, i, arr) => arr.findIndex(x => x.name === t.name) === i).map(t => (
            <button key={t.name} onClick={() => applyTheme(t)} style={{
              background: theme.name === t.name ? t.primary : '#222',
              color: theme.name === t.name ? '#fff' : '#aaa',
              border: `2px solid ${t.primary}`,
              borderRadius: '8px', padding: '0.5rem', cursor: 'pointer',
              fontWeight: theme.name === t.name ? 'bold' : 'normal',
              fontSize: '0.82rem', textAlign: 'left'
            }}>
              <div style={{ width: '14px', height: '14px', background: t.primary, borderRadius: '50%', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle', border: '1px solid #444' }} />
              {t.name}{t.name === 'Bundesliga' ? ' ⭐' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div style={block}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>🔑 API-Keys</h3>
        <p style={{ color: '#555', fontSize: '0.8rem', margin: '0 0 1.2rem 0' }}>
          Alle Keys werden nur lokal in deinem Browser gespeichert (localStorage) – nie auf dem Server.
        </p>
        {API_KEYS.map(api => (
          <div key={api.id} style={{ marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
              <div>
                <span style={{ fontWeight: 'bold', color: '#ddd' }}>{api.label}</span>
                {api.free && <span style={{ marginLeft: '0.5rem', background: '#14532d', color: '#4ade80', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px' }}>FREE</span>}
              </div>
              <a href={api.url} target='_blank' rel='noreferrer' style={{ fontSize: '0.72rem', color: theme.primary, textDecoration: 'none' }}>
                🔗 {api.urlLabel}
              </a>
            </div>
            <p style={{ color: '#555', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>{api.description}</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type='password'
                value={keys[api.id]}
                onChange={e => setKeys(prev => ({ ...prev, [api.id]: e.target.value }))}
                placeholder={api.placeholder}
                style={{ flex: 1, background: '#111', color: '#fff', border: `1px solid ${keys[api.id] ? '#4ade8044' : '#333'}`, borderRadius: '6px', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
              />
              <button onClick={() => saveKey(api.id)} style={{
                background: savedMsg[api.id] ? '#14532d' : theme.primary,
                color: '#fff', border: 'none', borderRadius: '6px',
                padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                minWidth: '90px', transition: 'background 0.3s'
              }}>
                {savedMsg[api.id] ? '✅ Gespeichert' : 'Speichern'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Datenbankbereinigung */}
      <div style={block}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🗑️ Datenbankbereinigung</h3>
        <span style={label}>Gespeicherte Statistiken löschen um Speicherplatz freizugeben</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={cleanupDays} onChange={e => setCleanupDays(Number(e.target.value))}
            style={{ background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px', padding: '0.5rem 0.8rem', fontSize: '0.9rem', flex: 1 }}>
            {CLEANUP_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
          <button onClick={handleCleanup} style={{ background: '#991b1b', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}>Löschen</button>
        </div>
        {cleanupMsg && <p style={{ color: '#4ade80', marginTop: '0.5rem', fontSize: '0.85rem' }}>{cleanupMsg}</p>}
      </div>

      {/* Datenquellen */}
      <div style={{ ...block, background: '#111', border: '1px solid #1a1a1a' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>ℹ️ Datenquellen</h3>
        <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: '1.9' }}>
          <div>⚽ <strong style={{ color: '#888' }}>OpenLigaDB</strong> – Bundesliga (kein Key nötig)</div>
          <div>🏆 <strong style={{ color: '#888' }}>TheSportsDB</strong> – Vereinsinfos & Logos</div>
          <div>📡 <strong style={{ color: '#888' }}>API-Football</strong> – Live-Stats, xG, TV, Schiedsrichter</div>
          <div>🌍 <strong style={{ color: '#888' }}>Football-Data.org</strong> – Internationale Ligen</div>
        </div>
      </div>

      {/* App Info Footer */}
      <div style={{ textAlign: 'center', padding: '1.5rem 0 0.5rem 0', borderTop: '1px solid #1a1a1a', marginTop: '0.5rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: theme.primary, marginBottom: '0.3rem' }}>
          📊 StatNerds
        </div>
        <div style={{ fontSize: '0.78rem', color: '#444', marginBottom: '0.5rem' }}>
          Version {APP_VERSION}
        </div>
        <a
          href={GITHUB_URL}
          target='_blank'
          rel='noreferrer'
          style={{ fontSize: '0.78rem', color: '#555', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z'/>
          </svg>
          GitHub – freddykrueger88/StatNerds
        </a>
        <div style={{ fontSize: '0.68rem', color: '#2a2a2a', marginTop: '0.5rem' }}>
          Made with ❤️ & ⚽
        </div>
      </div>
    </div>
  );
}
