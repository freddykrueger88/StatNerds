import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getPrediction, getPredictionXG } from '../services/api';

export default function PredictionBlock({ team1, team2, fixtureId, theme }) {
  const [mode, setMode] = useState('basic');
  const [apiKey] = useLocalStorage('sn_key_api_football', null);

  const hasXG = !!(apiKey && fixtureId);

  const { data: pred } = useFetch(
    () => {
      if (!team1 || !team2) return Promise.resolve(null);
      return mode === 'xg' && hasXG
        ? getPredictionXG(fixtureId, apiKey)
        : getPrediction(team1, team2);
    },
    null,
    [team1, team2, fixtureId, mode, apiKey]
  );

  if (!pred) return null;

  const { home_win, draw, away_win, expected_goals_home, expected_goals_away, model } = pred;

  return (
    <div style={{ marginTop: '0.8rem' }}>
      {hasXG && (
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {['basic', 'xg'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              background: mode === m ? theme.primary : '#1a1a1a',
              color: mode === m ? '#fff' : '#555',
              border: `1px solid ${mode === m ? theme.primary : '#333'}`,
              borderRadius: '4px', padding: '0.15rem 0.5rem',
              cursor: 'pointer', fontSize: '0.68rem'
            }}>{m === 'basic' ? '📊 Historisch' : '🧠 xG-Modell'}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '24px', fontSize: '0.72rem' }}>
        <div style={{ width: `${home_win}%`, background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{home_win}%</div>
        <div style={{ width: `${draw}%`,     background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{draw}%</div>
        <div style={{ width: `${away_win}%`, background: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{away_win}%</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#555', marginTop: '3px' }}>
        <span>🏠 {team1}</span>
        <span style={{ color: '#333' }}>{model || 'Poisson'}</span>
        <span>{team2} ✈️</span>
      </div>

      {expected_goals_home !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.72rem', color: '#444', marginTop: '0.3rem' }}>
          <span>xG: <strong style={{ color: '#aaa' }}>{expected_goals_home}</strong></span>
          <span>xG: <strong style={{ color: '#aaa' }}>{expected_goals_away}</strong></span>
        </div>
      )}
    </div>
  );
}
