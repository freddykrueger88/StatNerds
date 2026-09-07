import React from 'react';

// Ehrlicher Hinweis zur DEL-Datenlage (Issue #25): Die DEL unterhält aktuell
// keine öffentliche API (penny-del.org liefert ohne Auth 404). Es werden keine
// Fake-Daten angezeigt – die NHL ist über die offizielle API vollständig verfügbar.
export default function DelNotice({ theme }) {
  return (
    <div style={{
      background: '#181a18', borderLeft: `4px solid ${theme.primary}`, borderRadius: '8px',
      padding: '0.55rem 0.8rem', margin: '0 0 1rem', fontSize: '0.75rem', color: '#999', lineHeight: 1.5,
    }}>
      <strong style={{ color: theme.primary }}>ℹ️ DEL aktuell nicht verfügbar:</strong>{' '}
      Die Deutsche Eishockey Liga stellt keine öffentliche Daten-API bereit (penny-del.org liefert ohne Auth 404).
      Wir zeigen deshalb keine erfundenen Werte – hier finden sich die kompletten <strong>NHL</strong>-Daten
      (offizielle, keylose API). Sobald die DEL eine Schnittstelle anbietet, wird sie ergänzt.
    </div>
  );
}
