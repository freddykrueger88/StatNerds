import React from 'react';

export default function StatsBar({ label, home, away, homeColor, format }) {
  const fmt = v => {
    if (v === null || v === undefined) return '-';
    if (format === 'percent') return v;
    return v;
  };

  const hNum = parseFloat(String(home).replace('%', '')) || 0;
  const aNum = parseFloat(String(away).replace('%', '')) || 0;
  const total = hNum + aNum || 1;
  const homePct = Math.round((hNum / total) * 100);
  const awayPct = 100 - homePct;

  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>
        <span style={{ fontWeight: 'bold', color: '#ddd' }}>{fmt(home)}</span>
        <span style={{ color: '#555' }}>{label}</span>
        <span style={{ fontWeight: 'bold', color: '#ddd' }}>{fmt(away)}</span>
      </div>
      <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', height: '6px', background: '#333' }}>
        <div style={{ width: `${homePct}%`, background: homeColor || '#4ade80', transition: 'width 0.5s' }} />
        <div style={{ width: `${awayPct}%`, background: '#f87171' }} />
      </div>
    </div>
  );
}
