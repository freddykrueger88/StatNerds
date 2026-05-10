import React, { useEffect, useState } from 'react';

const SORT_OPTIONS = [
  { key: 'wins',            label: '🏆 Siege' },
  { key: 'goalsFor',       label: '⚽ Tore' },
  { key: 'goalDiff',       label: '± Diff' },
  { key: 'cleanSheets',    label: '🛡️ Clean Sheets' },
  { key: 'avgGoalsFor',    label: '📊 Ø Tore/Spiel' },
  { key: 'winRate',        label: '📈 Siegquote' },
];

function FormBadge({ result }) {
  const color = result === 'W' ? '#4ade80' : result === 'D' ? '#facc15' : '#f87171';
  const label = result === 'W' ? 'S' : result === 'D' ? 'U' : 'N';
  return (
    <span style={{
      display: 'inline-block', width: '18px', height: '18px', lineHeight: '18px',
      borderRadius: '3px', background: color, color: '#000',
      fontSize: '0.6rem', fontWeight: 'bold', textAlign: 'center', marginRight: '2px'
    }}>{label}</span>
  );
}

export default function TeamStats({ theme }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('wins');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/teamstats/bl1')
      .then(r => r.json())
      .then(d => { setStats(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Vereinsstatistiken...</p>;

  const filtered = stats
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div>
      <h2 style={{ color: theme.primary, marginBottom: '0.8rem' }}>📊 Vereinsstatistiken 2025/26</h2>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='🔍 Verein suchen...'
          style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.85rem', flex: 1, minWidth: '140px' }}
        />
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {SORT_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setSortKey(o.key)} style={{
              background: sortKey === o.key ? theme.primary : '#1a1a1a',
              color: sortKey === o.key ? '#fff' : '#666',
              border: `1px solid ${sortKey === o.key ? theme.primary : '#2a2a2a'}`,
              borderRadius: '5px', padding: '0.3rem 0.6rem',
              cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap'
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {filtered.map((t, i) => (
          <div key={t.name} style={{
            background: '#1a1a1a', borderRadius: '10px', padding: '1rem',
            borderLeft: `3px solid ${i === 0 ? theme.primary : '#222'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              {t.logo
                ? <img src={t.logo} alt='' style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                : <span style={{ fontSize: '1.2rem' }}>⚽</span>
              }
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#555' }}>{t.played} Spiele</div>
              </div>
              {i === 0 && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: theme.primary + '22', color: theme.primary, padding: '1px 6px', borderRadius: '4px' }}>#{i+1}</span>}
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem', marginBottom: '0.6rem', textAlign: 'center' }}>
              {[
                { label: 'Siege', value: t.wins, color: '#4ade80' },
                { label: 'Unent.', value: t.draws, color: '#facc15' },
                { label: 'Nied.', value: t.losses, color: '#f87171' },
                { label: 'Tore', value: `${t.goalsFor}:${t.goalsAgainst}`, color: '#aaa' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111', borderRadius: '5px', padding: '0.3rem' }}>
                  <div style={{ color: s.color, fontWeight: 'bold', fontSize: '1rem' }}>{s.value}</div>
                  <div style={{ color: '#444', fontSize: '0.62rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Extra stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#555', marginBottom: '0.5rem' }}>
              <span>ø {t.avgGoalsFor} Tore/Spiel</span>
              <span>🛡️ {t.cleanSheets} Clean Sheets</span>
              <span>📈 {t.winRate}%</span>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#444', marginRight: '0.2rem' }}>Form:</span>
              {t.form.length ? t.form.map((f, j) => <FormBadge key={j} result={f} />) : <span style={{ color: '#333', fontSize: '0.7rem' }}>–</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
