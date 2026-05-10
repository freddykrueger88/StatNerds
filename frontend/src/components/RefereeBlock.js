import React, { useEffect, useState } from 'react';

export default function RefereeBlock({ refereeName, fixtureId, theme }) {
  const [profile, setProfile] = useState(null);
  const [apifRef, setApifRef] = useState(null);
  const apiKey = localStorage.getItem('sn_key_api_football');

  // Profil aus eigenem Endpoint
  useEffect(() => {
    if (!refereeName) return;
    fetch(`/api/referee/profile/${encodeURIComponent(refereeName)}`)
      .then(r => r.json())
      .then(setProfile)
      .catch(() => {});
  }, [refereeName]);

  // Schiedsrichter aus API-Football
  useEffect(() => {
    if (!fixtureId || !apiKey) return;
    fetch(`/api/referee/apif/${fixtureId}`, { headers: { 'x-api-key': apiKey } })
      .then(r => r.json())
      .then(d => { if (d.referee) setApifRef(d); })
      .catch(() => {});
  }, [fixtureId, apiKey]);

  const displayName = apifRef?.referee || refereeName;
  if (!displayName) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.6rem 0.8rem', background: '#111', borderRadius: '8px', marginTop: '0.5rem' }}>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🟨</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#ddd' }}>{displayName}</div>
        {apifRef?.venue?.name && (
          <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '1px' }}>
            🏟️ {apifRef.venue.name}{apifRef.venue.city ? `, ${apifRef.venue.city}` : ''}
          </div>
        )}
        {profile?.bio && (
          <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '0.3rem', fontStyle: 'italic' }}>{profile.bio}</div>
        )}
      </div>
      <span style={{ fontSize: '0.65rem', color: '#333', flexShrink: 0 }}>SR</span>
    </div>
  );
}
