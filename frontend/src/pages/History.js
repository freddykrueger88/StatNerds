import React, { useState } from 'react';
import { useHistory } from '../hooks/useHistory';
import GameDetail from './GameDetail';
import { leagueLabel } from '../leagues';

const TYPE_ICON = { game: '⚽', team: '🏟️', player: '👤' };

const timeAgo = ts => {
  const d = Date.now() - ts;
  if (d < 60_000) return 'gerade eben';
  if (d < 3_600_000) return `vor ${Math.floor(d / 60_000)} Min.`;
  if (d < 86_400_000) return `vor ${Math.floor(d / 3_600_000)} Std.`;
  return `vor ${Math.floor(d / 86_400_000)} Tagen`;
};

export default function History({ theme, league, onNavigate }) {
  const { history, clear } = useHistory();
  const [selected, setSelected] = useState(null);

  if (selected) return (
    <GameDetail game={selected} league={selected.league || league} theme={theme} onBack={() => setSelected(null)} />
  );

  if (!history.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🕘</div>
        <p style={{ fontSize: '0.9rem' }}>Noch nichts angesehen.<br /><span style={{ color: '#444', fontSize: '0.8rem' }}>Geöffnete Spiele, Vereine und Spieler erscheinen hier.</span></p>
        <button onClick={clear} style={{ background: '#222', color: '#666', border: '1px solid #333', borderRadius: '8px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.8rem' }}>Verlauf löschen</button>
      </div>
    );
  }

  const openEntry = h => {
    if (h.type === 'game' && h.game) {
      setSelected(h.game);
      return;
    }
    if (h.type === 'team' || h.type === 'player') { onNavigate('teams', h.league); return; }
    onNavigate('games', h.league);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '1.05rem' }}>🕘 Verlauf</h2>
        <button onClick={clear} style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: '8px', padding: '0.3rem 0.9rem', cursor: 'pointer', fontSize: '0.78rem' }}>
          🗑️ Verlauf löschen
        </button>
      </div>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 0.9rem' }}>
        Die letzten {Math.min(history.length, 10)} angesehenen Inhalte (localStorage, nur auf diesem Gerät).
      </p>

      {history.map((h, i) => (
        <button key={i} onClick={() => openEntry(h)} style={{
          display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%',
          background: h.type === 'game' && h.game ? '#1a1a2e' : '#1a1a1a',
          color: '#ccc', border: '1px solid #242424', borderRadius: '10px',
          padding: '0.55rem 0.8rem', marginBottom: '0.45rem', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem',
          borderLeft: `4px solid ${theme.primary}`,
        }}>
          <span style={{ fontSize: '1.1rem' }}>{TYPE_ICON[h.type] || '📄'}</span>
          <span style={{ flex: 1, fontWeight: 'bold' }}>
            {h.label}
            {h.league && <small style={{ display: 'block', color: '#666', fontWeight: 'normal' }}>{leagueLabel(h.league)}</small>}
          </span>
          {h.type === 'game' && h.game && (() => {
            const res = (h.game.matchResults || []).find(r => r.resultTypeID === 2);
            return res ? <strong style={{ color: theme.primary }}>{res.pointsTeam1}:{res.pointsTeam2}</strong> : null;
          })()}
          <small style={{ color: '#555', whiteSpace: 'nowrap' }}>{timeAgo(h.ts)}</small>
        </button>
      ))}
    </div>
  );
}