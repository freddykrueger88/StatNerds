import React, { useState } from 'react';

const THEMES = [
  { name: 'Standard', primary: '#4ade80', secondary: '#166534' },
  { name: 'FC Bayern', primary: '#ED1C24', secondary: '#FFFFFF' },
  { name: 'BVB Dortmund', primary: '#FCEA10', secondary: '#000000' },
  { name: 'Bayer Leverkusen', primary: '#E32221', secondary: '#000000' },
  { name: 'RB Leipzig', primary: '#DD0741', secondary: '#001E62' },
  { name: 'Schalke 04', primary: '#004D9D', secondary: '#FFFFFF' },
  { name: 'HSV', primary: '#0B1F69', secondary: '#FFFFFF' },
  { name: 'Werder Bremen', primary: '#1D9253', secondary: '#FFFFFF' },
  { name: 'Nacht (Dark)', primary: '#6366f1', secondary: '#1e1b4b' },
];

const CLEANUP_OPTIONS = [
  { label: 'Statistiken älter als 7 Tage', days: 7 },
  { label: 'Statistiken älter als 14 Tage', days: 14 },
  { label: 'Statistiken älter als 30 Tage', days: 30 },
  { label: 'Alle gespeicherten Statistiken löschen', days: 0 },
];

export default function Settings({ theme, setTheme }) {
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleanupMsg, setCleanupMsg] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('sn_api_key') || '');

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('sn_theme', JSON.stringify(t));
  };

  const handleCleanup = async () => {
    if (!window.confirm(`Wirklich Statistiken löschen (${cleanupDays === 0 ? 'ALLE' : 'älter als ' + cleanupDays + ' Tage'})?`)) return;
    try {
      const url = cleanupDays === 0 ? '/api/stats/cleanup?days=0' : `/api/stats/cleanup?days=${cleanupDays}`;
      const r = await fetch(url, { method: 'DELETE' });
      const d = await r.json();
      setCleanupMsg(`✅ ${d.deleted} Einträge gelöscht.`);
    } catch {
      setCleanupMsg('❌ Fehler beim Löschen.');
    }
  };

  const block = { background: '#1a1a1a', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' };
  const label = { color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{ color: theme.primary }}>⚙️ Einstellungen</h2>

      {/* Theme */}
      <div style={block}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🎨 Theme / Vereinsfarben</h3>
        <span style={label}>Aktiv: <strong>{theme.name}</strong></span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
          {THEMES.map(t => (
            <button key={t.name} onClick={() => applyTheme(t)} style={{
              background: theme.name === t.name ? t.primary : '#222',
              color: theme.name === t.name ? '#000' : '#aaa',
              border: `2px solid ${t.primary}`,
              borderRadius: '8px', padding: '0.5rem', cursor: 'pointer',
              fontWeight: theme.name === t.name ? 'bold' : 'normal', fontSize: '0.82rem'
            }}>
              <div style={{ width: '16px', height: '16px', background: t.primary, borderRadius: '50%', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div style={block}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🔑 API-Football Key</h3>
        <span style={label}>Kostenlos unter api-sports.io registrieren</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder='Dein API-Key hier...'
            style={{ flex: 1, background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px', padding: '0.5rem 0.8rem', fontSize: '0.9rem' }}
          />
          <button onClick={() => { localStorage.setItem('sn_api_key', apiKey); alert('Key gespeichert!'); }} style={{
            background: theme.primary, color: '#000', border: 'none', borderRadius: '6px',
            padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold'
          }}>Speichern</button>
        </div>
      </div>

      {/* Datenbankbereinigung */}
      <div style={block}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🗑️ Datenbankbereinigung</h3>
        <span style={label}>Gespeicherte Statistiken löschen um Speicherplatz freizugeben</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={cleanupDays}
            onChange={e => setCleanupDays(Number(e.target.value))}
            style={{ background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px', padding: '0.5rem 0.8rem', fontSize: '0.9rem', flex: 1 }}
          >
            {CLEANUP_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
          <button onClick={handleCleanup} style={{
            background: '#991b1b', color: '#fff', border: 'none', borderRadius: '6px',
            padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold'
          }}>Löschen</button>
        </div>
        {cleanupMsg && <p style={{ color: '#4ade80', marginTop: '0.5rem', fontSize: '0.85rem' }}>{cleanupMsg}</p>}
      </div>

      {/* Info */}
      <div style={{ ...block, background: '#111', border: '1px solid #222' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>ℹ️ Datenquellen</h3>
        <div style={{ fontSize: '0.82rem', color: '#666', lineHeight: '1.8' }}>
          <div>⚽ <strong style={{ color: '#aaa' }}>OpenLigaDB</strong> – Bundesliga (kein Key nötig)</div>
          <div>🏆 <strong style={{ color: '#aaa' }}>TheSportsDB</strong> – Vereinsinfos & Logos</div>
          <div>📡 <strong style={{ color: '#aaa' }}>API-Football</strong> – Live-Stats & xG (Free-Tier)</div>
        </div>
      </div>
    </div>
  );
}
