import React from 'react';
import { leagueLabel } from '../leagues';

export default function LeagueUnavailable({ league }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛑</div>
      <p style={{ fontSize: '0.9rem', margin: '0 auto', maxWidth: '420px' }}>
        Diese Seite gibt es nur für Bundesliga-Ligen.
      </p>
      <p style={{ fontSize: '0.78rem', color: '#444', marginTop: '0.4rem' }}>
        Die {leagueLabel(league)} zeigen wir hier (noch) nicht – wähle oben 1. oder 2. Bundesliga.
      </p>
    </div>
  );
}