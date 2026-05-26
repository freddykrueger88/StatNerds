const axios = require('axios');

// Gibt Interval-Handle zurück für graceful shutdown
function schedule(name, intervalMs, fn) {
  console.log(`⏱️  Scheduler: ${name} startet (alle ${Math.round(intervalMs / 60000)} min)`);
  fn().catch(err => console.error(`❌ Scheduler [${name}] Init-Fehler:`, err.message));
  return setInterval(async () => {
    try { await fn(); }
    catch (err) { console.error(`❌ Scheduler [${name}] Fehler:`, err.message); }
  }, intervalMs);
}

module.exports = function startScheduler(cache) {
  const handles = [];

  // Aktueller Spieltag – 60s normal, prüft ob Live-Spiele laufen
  handles.push(schedule('Aktueller Spieltag', 60 * 1000, async () => {
    const r = await axios.get('https://api.openligadb.de/getmatchdata/bl1');
    cache.set('current', r.data, 90 * 1000);
    const liveCount = r.data.filter(
      g => !g.matchIsFinished && new Date(g.matchDateTimeUTC) < new Date()
    ).length;
    if (liveCount > 0) console.log(`🔴 ${liveCount} Spiel(e) live`);
  }));

  // Tabelle alle 15 Minuten
  handles.push(schedule('Tabelle', 15 * 60 * 1000, async () => {
    const r = await axios.get('https://api.openligadb.de/getbltable/bl1/2025');
    cache.set('table', r.data, 14 * 60 * 1000);
    console.log('✅ Tabelle aktualisiert');
  }));

  // Torjäger alle 30 Minuten – nutzt loadAllMatchdays aus games.js via Cache
  handles.push(schedule('Torjäger', 30 * 60 * 1000, async () => {
    // Cache löschen damit games.js neu lädt beim nächsten Request
    cache.del('scorers');
    cache.del('assists');
    cache.del('all_matchdays_raw');
    console.log('🔄 Torjäger/Assists Cache invalidiert – wird beim nächsten Request neu berechnet');
  }));

  console.log('🟢 Scheduler läuft');

  // Graceful shutdown
  process.on('SIGTERM', () => handles.forEach(h => clearInterval(h)));
  process.on('SIGINT',  () => handles.forEach(h => clearInterval(h)));

  return handles;
};
