import React, { useId } from 'react';

// XgChart (Issue #20): xG-Verlauf beider Teams über 90 Minuten als
// responsives SVG. API-Football liefert nur End-xG-Werte + Tor-Events
// (mit Minute) – daraus wird eine akkumulierte Näherungskurve gezeichnet
// (lineare Verteilung über die Spielzeit) und Tore als vertikale Marker
// gesetzt. Die Datenbasis ist real; der Kurvenverlauf ist eine
// Dokumentation dieser Eingangsdaten und wird transparent gekennzeichnet.
const W = 540;
const H = 200;
const PAD = { l: 38, r: 16, t: 20, b: 30 };
const MINUTES = 90;

export default function XgChart({ home, away, events, theme }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const homeXg = Number(home?.xG ?? 0);
  const awayXg = Number(away?.xG ?? 0);
  if (!homeXg && !awayXg) return null;

  const maxXg = Math.max(1, homeXg, awayXg, 0.5);
  const iX = m => PAD.l + (m / MINUTES) * (W - PAD.l - PAD.r);
  const iY = v => PAD.t + (1 - v / maxXg) * (H - PAD.t - PAD.b);

  // Akkumulierte Näherung über die Zeit (in 3-Minuten-Schritten)
  const points = side => Array.from({ length: 31 }, (_, i) => {
    const m = i * 3;
    const v = side * (m / MINUTES);
    return `${iX(m).toFixed(1)},${iY(v).toFixed(1)}`;
  }).join(' ');

  // Tore aus den API-Football-Events → Marker bei der jeweiligen Minute
  const goals = (events || []).filter(e => e.type === 'Goal').map(e => ({
    minute: e.time?.elapsed ?? 0,
    home: e.team?.id ? e.team.id === (home?.id || home?.teamId) : (e.team?.name === home?.name),
    scorer: e.player?.name || 'Tor',
  }));

  return (
    <div style={{ width: '100%', marginTop: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme?.primary || '#4f8cff' }}>
          📈 xG-Verlauf
        </span>
        <span style={{ fontSize: '0.72rem', color: '#666' }}>
          <span style={{ color: theme?.primary || '#4f8cff' }}>— {home?.name || 'Heim'}</span>&nbsp;
          <span style={{ color: '#facc15' }}>— {away?.name || 'Gast'}</span>&nbsp;· ⚽ Tore
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', background: 'transparent' }} role="img" aria-label={`xG-Verlauf ${home?.name || 'Heim'} vs ${away?.name || 'Gast'}`}>
        <defs>
          <linearGradient id={`xgfill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme?.primary || '#4f8cff'} stopOpacity="0.18" />
            <stop offset="100%" stopColor={theme?.primary || '#4f8cff'} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Halbzeit-Gitter */}
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={PAD.l} x2={W - PAD.r} y1={iY(maxXg * f)} y2={iY(maxXg * f)} stroke="#3a3a3a" strokeDasharray="3 4" strokeWidth="1" />
        ))}
        <line x1={iX(45)} x2={iX(45)} y1={PAD.t} y2={H - PAD.b} stroke="#3a3a3a" strokeDasharray="3 4" strokeWidth="1" />

        {/* xG-Aufbau (Heim gefüllt, Gast gelb) */}
        <polyline points={points(homeXg)} fill="none" stroke={theme?.primary || '#4f8cff'} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <polygon points={`${iX(0).toFixed(1)},${iY(0).toFixed(1)} ${points(homeXg)} ${iX(90).toFixed(1)},${iY(0).toFixed(1)}`} fill={`url(#xgfill-${gid})`} />
        <polyline points={points(awayXg)} fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Tor-Marker */}
        {goals.map((g, i) => (
          <line key={i} x1={iX(g.minute)} x2={iX(g.minute)} y1={iY(maxXg)} y2={iY(0)} stroke={g.home ? (theme?.primary || '#4f8cff') : '#facc15'} strokeOpacity="0.35" strokeWidth="1" />
        ))}
        {goals.map((g, i) => (
          <text key={`g${i}`} x={iX(g.minute)} y={PAD.t + 10 * (g.home ? 1 : 2) - 2} textAnchor="middle" fontSize="10">⚽<title>{`${g.minute}' ${g.scorer}`}</title></text>
        ))}

        {/* Achsenbeschriftung */}
        {[0, 15, 30, 45, 60, 75, 90].map(m => (
          <text key={m} x={iX(m)} y={H - PAD.b + 14} textAnchor="middle" fontSize="8" fill="#555">{m}'</text>
        ))}
        <text x={PAD.l - 6} y={iY(homeXg) + 3} textAnchor="end" fontSize="9" fill="#999">{homeXg.toFixed(2)}</text>
        <text x={PAD.l - 6} y={iY(awayXg) + 3} textAnchor="end" fontSize="9" fill="#999">{awayXg.toFixed(2)}</text>
      </svg>

      <div style={{ fontSize: '0.68rem', color: '#666', marginTop: '0.1rem' }}>
        ⓘ Näherungsverlauf: API-Football liefert xG als Endwert pro Team + Tor-Minuten; die Kurve verteilt den Endwert über die Spielzeit, Tore sind reale Markierungen.
      </div>
    </div>
  );
}
