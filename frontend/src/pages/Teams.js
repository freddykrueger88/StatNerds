import React, { useEffect, useState } from 'react';

function TeamCard({ team, theme, onClick }) {
  return (
    <div onClick={() => onClick(team)} style={{
      background: '#1a1a1a', borderRadius: '10px', padding: '1rem',
      cursor: 'pointer', textAlign: 'center',
      border: '1px solid #222', transition: 'border 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = theme.primary}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
    >
      <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
        {team.logoUrl
          ? <img src={team.logoUrl} alt={team.name} style={{ maxHeight: '60px', maxWidth: '70px', objectFit: 'contain' }} />
          : <div style={{ fontSize: '2rem' }}>⚽</div>
        }
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ddd' }}>{team.name || team.short}</div>
      {team.stadiumName && <div style={{ fontSize: '0.68rem', color: '#555', marginTop: '0.2rem' }}>{team.stadiumName}</div>}
    </div>
  );
}

function TeamDetail({ team, theme, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={{
        background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`,
        borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem'
      }}>← Zurück</button>

      {/* Banner / Fanart */}
      {team.fanartUrl && (
        <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem', maxHeight: '180px' }}>
          <img src={team.fanartUrl} alt='' style={{ width: '100%', objectFit: 'cover', maxHeight: '180px' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {team.logoUrl && (
          <img src={team.logoUrl} alt={team.name} style={{ width: '90px', objectFit: 'contain', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <h2 style={{ color: theme.primary, margin: '0 0 0.3rem 0' }}>{team.name}</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#666', marginBottom: '0.8rem' }}>
            {team.founded && <span>📅 Gegründet {team.founded}</span>}
            {team.country && <span>🏳️ {team.country}</span>}
            {team.league && <span>🏆 {team.league}</span>}
          </div>

          {team.stadiumName && (
            <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '0.8rem', marginBottom: '0.8rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.3rem' }}>🏟️ {team.stadiumName}</div>
              {team.stadiumLocation && <div style={{ fontSize: '0.78rem', color: '#666' }}>📍 {team.stadiumLocation}</div>}
              {team.stadiumCapacity && <div style={{ fontSize: '0.78rem', color: '#666' }}>👥 {parseInt(team.stadiumCapacity).toLocaleString('de-DE')} Plätze</div>}
              {team.stadiumThumb && <img src={team.stadiumThumb} alt='' style={{ width: '100%', borderRadius: '6px', marginTop: '0.5rem', objectFit: 'cover', maxHeight: '140px' }} />}
            </div>
          )}

          {(team.descriptionDE || team.descriptionEN) && (
            <p style={{ fontSize: '0.82rem', color: '#777', lineHeight: '1.6', margin: '0 0 0.8rem 0' }}>
              {(team.descriptionDE || team.descriptionEN)?.slice(0, 400)}{(team.descriptionDE || team.descriptionEN)?.length > 400 ? '...' : ''}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {team.website && <a href={`https://${team.website}`} target='_blank' rel='noreferrer' style={{ fontSize: '0.75rem', color: theme.primary, textDecoration: 'none' }}>🌐 Website</a>}
            {team.instagram && <a href={`https://instagram.com/${team.instagram}`} target='_blank' rel='noreferrer' style={{ fontSize: '0.75rem', color: '#e1306c', textDecoration: 'none' }}>📸 Instagram</a>}
            {team.facebook && <a href={`https://facebook.com/${team.facebook}`} target='_blank' rel='noreferrer' style={{ fontSize: '0.75rem', color: '#1877f2', textDecoration: 'none' }}>👤 Facebook</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Teams({ theme }) {
  const [teamList, setTeamList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(d => setTeamList(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const loadDetail = (team) => {
    setSelected(team);
    setLoading(true);
    setDetail(null);
    fetch(`/api/teams/${team.id}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  if (selected) {
    return loading
      ? <p style={{ color: '#666', textAlign: 'center', marginTop: '3rem' }}>⏳ Lade Vereinsinfos...</p>
      : detail && <TeamDetail team={detail} theme={theme} onBack={() => { setSelected(null); setDetail(null); }} />;
  }

  const filtered = teamList.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.short.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ color: theme.primary, marginBottom: '0.8rem' }}>🏟️ Bundesliga-Vereine</h2>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder='🔍 Verein suchen...'
        style={{ width: '100%', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {filtered.map(t => <TeamCard key={t.id} team={t} theme={theme} onClick={loadDetail} />)}
      </div>
    </div>
  );
}
