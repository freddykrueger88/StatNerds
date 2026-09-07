import React, { useId } from 'react';

// FormChart (Issue #37): zeichnet die Formkurve der letzten Spiele eines
// Vereins als responsives SVG. Punkte (kumuliert, S/U/N-färbig) und Tore pro
// Spiel als zweite Linie. Ohne Farben → weiße Zeichenfläche, damit der
// Invert-Filter des Light-Modes die Kurven nicht verfälscht.
const W = 520;
const H = 190;
const PAD = { l: 34, r: 14, t: 18, b: 30 };

function linePoints(series, iX, iY) {
  return series.map((v, i) => `${iX(i).toFixed(1)},${iY(v).toFixed(1)}`).join(' ');
}

const FORM_COLORS = { S: '#22c55e', U: '#94a3b8', N: '#f87171' };
const RESULT_LABEL = { S: 'S', U: 'U', N: 'N' };

export default function FormChart({ games = [], team, theme, opponentLabel, height, compact }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!games.length) return null;

  const list   = [...games].sort((a, b) => a.date.localeCompare(b.date));
  const cum    = []; let sum = 0;
  list.forEach(g => { sum += g.points || 0; cum.push(sum); });
  const maxGoals = Math.max(1, ...list.map(g => g.goalsFor || 0));
  const maxPts   = Math.max(1, ...cum);
  const maxVal   = Math.max(maxPts, maxGoals * 1.15);
  const n        = list.length;

  const iX = i => PAD.l + (n === 1 ? W - PAD.l - PAD.r : (i / (n - 1)) * (W - PAD.l - PAD.r));
  const iY = v => PAD.t + (1 - v / maxVal) * (H - PAD.t - PAD.b);

  const short1 = d => String(d).slice(11, 16);
  const pts = linePoints(cum, iX, iY);
  const goals = linePoints(list.map(g => g.goalsFor), iX, iY);
  const total = cum[n - 1];

  const mini = !!compact;
  const svgH  = height || (mini ? 120 : H);

  return (
    <div className={`formchart${theme?.fontClass ? ` ${theme.fontClass}` : ''}`} style={{ width: '100%', marginTop: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme?.primary || '#4f8cff' }}>
          📈 Formkurve · letzte {n} Spiele
        </span>
        <span style={{ fontSize: '0.72rem', color: '#666' }}>
          {total} Punkte · <span style={{ color: '#22c55e' }}>● Punkte</span> <span style={{ color: '#fbbf24' }}>● Tore</span>
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${mini ? 140 : H}`} style={{ width: '100%', height: 'auto', display: 'block', background: 'transparent' }} role="img" aria-label={`Formkurve ${team || ''} – letzte ${n} Spiele`}>
        <defs>
          <linearGradient id={`formfill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f8cff" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={PAD.l} x2={W - PAD.r} y1={iY(maxVal * f)} y2={iY(maxVal * f)} stroke="#3a3a3a" strokeDasharray="3 4" strokeWidth="1" />
        ))}

        <polygon points={`${iX(0).toFixed(1)},${iY(0).toFixed(1)} ${linePoints(cum, iX, iY)} ${iX(n - 1).toFixed(1)},${iY(0).toFixed(1)}`} fill={`url(#formfill-${gid})`} />
        <polyline points={pts} fill="none" stroke="#4f8cff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={goals} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="2 3" />

        {list.map((g, i) => {
          const label = g.result || '?';
          return (
            <g key={g.date + i}>
              <line x1={iX(i)} x2={iX(i)} y1={iY(cum[i])} y2={iY(cum[i]) - 9} stroke={FORM_COLORS[label] || '#94a3b8'} strokeWidth="2" />
              <circle cx={iX(i)} cy={iY(cum[i])} r="3.2" fill={FORM_COLORS[label] || '#94a3b8'} />
              <text x={iX(i)} y={iY(cum[i]) - 13} textAnchor="middle" fontSize="9" fill={FORM_COLORS[label] || '#94a3b8'} fontWeight="700">
                {RESULT_LABEL[label] || label}
                <title>{`${g.opponent || ''} ${g.score} – ${g.date ? short1(g.date) : ''}`}</title>
              </text>
            </g>
          );
        })}

        {list.map((g, i) =>
          <text key={`d${i}`} x={iX(i)} y={H - PAD.b + 13} textAnchor="middle" fontSize="8" fill="#555">
            {short1(g.date)}
          </text>
        )}
      </svg>

      {opponentLabel && <div style={{ fontSize: '0.72rem', color: '#777', marginTop: '0.1rem' }}>{opponentLabel}</div>}
    </div>
  );
}
