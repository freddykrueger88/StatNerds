import React, { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setHealth(d.status))
      .catch(() => setHealth('Backend nicht erreichbar'));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1>📊 StatNerds</h1>
      <p>Penible Sport-Statistiken für echte Daten-Nerds.</p>
      <p>Backend: <strong>{health || 'Verbinde...'}</strong></p>
      <p style={{ color: '#888' }}>Frontend läuft – Phase 6 (UI) kommt als nächstes!</p>
    </div>
  );
}

export default App;
