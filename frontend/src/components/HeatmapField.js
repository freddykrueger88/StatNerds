import React, { useId, useMemo } from 'react';

// HeatmapField (Issue #22): Spielfeld-Overlay mit Positions-Dichte eines
// Spielers. Erwartet Punkte als Prozentkoordinaten {x: 0-100, y: 0-100}
// (eigene Hälfte unten, gegnerisches Tor oben). Jeder Punkt wird als
// radialer Wärmefleck (zwei Kreise, blur) gezeichnet – mehrere Auftritte
// bilden so eine echte Heatmap-Dichte. Reines Inline-SVG, responsive via
// viewBox (konsistent mit FormChart/XgChart).
const VW = 500;
const VH = 330;
const M = 18; // Rasen-Rand um das Feld

function Dot({ x, y, color, gid }) {
  const cx = M + (x / 100) * (VW - 2 * M);
  const cy = M + (y / 100) * (VH - 2 * M);
  const r = 26;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#hm-${gid})`} />
      <circle cx={cx} cy={cy} r={r * 0.45} fill={color} fillOpacity="0.55" />
    </g>
  );
}

export default function HeatmapField({ team, name, points, theme }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const color = theme?.primary || '#37d67a';
  const pts = useMemo(() => Array.isArray(points) ? points : [], [points]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme?.primary || '#4f8cff' }}>🗺️ Heatmap {name || ''}</span>
        <span style={{ fontSize: '0.7rem', color: '#666' }}>{team ? `${team} · ` : ''}{pts.length} Spiele</span>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: 'auto', display: 'block', background: 'transparent' }} role="img" aria-label={`Heatmap ${name || 'Spieler'}`}>
        <defs>
          <radialGradient id={`hm-${gid}`}>
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x={M} y={M} width={VW - 2 * M} height={VH - 2 * M} rx="3" fill="#2f7d32" fillOpacity="0.4" stroke="#4caf50" strokeOpacity="0.5" strokeWidth="1.5" />
        <line x1={M} x2={VW - M} y1={VH / 2} y2={VH / 2} stroke="#4caf50" strokeOpacity="0.7" strokeWidth="1.5" />
        <circle cx={VW / 2} cy={VH / 2} r="55" fill="none" stroke="#4caf50" strokeOpacity="0.7" strokeWidth="1.5" />
        <rect x={M} y={VH - M - 44} width={112} height={44} fill="none" stroke="#4caf50" strokeOpacity="0.7" strokeWidth="1.5" />
        <rect x={VW - M - 112} y={M} width={112} height={44} fill="none" stroke="#4caf50" strokeOpacity="0.7" strokeWidth="1.5" />
        <rect x={M + 30} y={VH - M - 16} width={(VW - 2 * M - 60) / 2} height={16} fill="none" stroke="#4caf50" strokeOpacity="0.7" strokeWidth="1.5" />
        <rect x={(VW + 2 * M - 30) / 2} y={M} width={(VW - 2 * M - 60) / 2} height={16} fill="none" stroke="#4caf50" strokeOpacity="0.7" strokeWidth="1.5" />
        <text x={M + 4} y={VH - M - 20} fontSize="9" fill="#8fd694">EIGENES TOR</text>
        <text x={VW - M - 4} y={M + 14} fontSize="9" fill="#8fd694" textAnchor="end">GEGNERISCHES TOR</text>

        {pts.map((p, i) => (
          <Dot key={i} x={p.x} y={p.y} color={color} gid={gid} />
        ))}
      </svg>

      <div style={{ fontSize: '0.68rem', color: '#666', marginTop: '0.1rem' }}>
        ⓘ Startelf-Positionen aus den letzten abgeschlossenen Spiele des Teams (API-Football-Aufstellungen). Ein Punkt pro Spiel; Torwart unten, Sturm oben.
      </div>
    </div>
  );
}
