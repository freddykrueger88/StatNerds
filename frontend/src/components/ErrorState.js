import React from 'react';

export default function ErrorState({ message, onRetry, icon = '⚠️' }) {
  return (
    <div style={{
      textAlign: 'center', padding: '3rem 1rem',
      background: '#1a0a0a', borderRadius: '12px',
      border: '1px solid #3a1010', marginTop: '1rem'
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{icon}</div>
      <div style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
        Fehler beim Laden
      </div>
      <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: '1.2rem', maxWidth: '280px', margin: '0 auto 1.2rem' }}>
        {message || 'Die Daten konnten nicht geladen werden. Bitte prüfe deine Verbindung.'}
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b',
          borderRadius: '8px', padding: '0.5rem 1.2rem',
          cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold'
        }}>
          🔄 Erneut versuchen
        </button>
      )}
    </div>
  );
}
