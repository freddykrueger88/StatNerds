import React, { useEffect, useState } from 'react';

const BROADCASTER_COLORS = {
  'Sky Sport':         { bg: '#0f4c81', color: '#fff' },
  'DAZN':             { bg: '#f8ff00', color: '#000' },
  'SAT.1':            { bg: '#e60026', color: '#fff' },
  'ARD Sportschau':   { bg: '#003d7c', color: '#fff' },
  'ZDF':              { bg: '#000000', color: '#fff' },
  'Blue Sport':       { bg: '#0057b8', color: '#fff' },
  'SRF':              { bg: '#e8002d', color: '#fff' },
  'Sky Österreich':  { bg: '#0f4c81', color: '#fff' },
};

export default function BroadcastBadge({ matchDate, compact = false }) {
  const [data, setData] = useState(null);
  const country = localStorage.getItem('sn_country') || 'DE';

  useEffect(() => {
    if (!matchDate) return;
    const encoded = encodeURIComponent(matchDate);
    fetch(`/api/broadcast/${encoded}?country=${country}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [matchDate, country]);

  if (!data?.broadcasters?.length) return null;

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
        {data.broadcasters.map((b, i) => {
          const style = BROADCASTER_COLORS[b.broadcaster] || { bg: '#222', color: '#aaa' };
          return (
            <span key={i} style={{
              background: style.bg, color: style.color,
              fontSize: '0.6rem', fontWeight: 'bold',
              padding: '1px 5px', borderRadius: '3px',
            }}>{b.broadcaster}</span>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.8rem' }}>
      <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: '0.3rem' }}>📺 Übertragung ({country})</div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {data.broadcasters.map((b, i) => {
          const style = BROADCASTER_COLORS[b.broadcaster] || { bg: '#222', color: '#aaa' };
          return (
            <div key={i} style={{
              background: style.bg, color: style.color,
              borderRadius: '5px', padding: '0.3rem 0.6rem',
              fontSize: '0.75rem', fontWeight: 'bold',
            }}>
              {b.broadcaster}
              {b.note && <span style={{ fontWeight: 'normal', opacity: 0.8, marginLeft: '0.3rem', fontSize: '0.65rem' }}>({b.note})</span>}
              {b.type === 'free' && <span style={{ marginLeft: '0.3rem', fontSize: '0.6rem', background: '#14532d', color: '#4ade80', padding: '0 4px', borderRadius: '3px' }}>FREE</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
