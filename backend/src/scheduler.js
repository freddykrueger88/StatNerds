const axios = require('axios');

// Einfacher Cron-Scheduler ohne externe Abhängigkeiten
function schedule(name, intervalMs, fn) {
  console.log(`⏱️  Scheduler: ${name} startet (alle ${Math.round(intervalMs / 60000)} min)`);
  fn(); // Direkt beim Start einmal ausführen
  setInterval(async () => {
    try {
      await fn();
    } catch (err) {
      console.error(`❌ Scheduler [${name}] Fehler:`, err.message);
    }
  }, intervalMs);
}

module.exports = function startScheduler(cache) {
  // Aktueller Spieltag alle 2 Minuten (während Spielbetrieb relevant)
  schedule('Aktueller Spieltag', 2 * 60 * 1000, async () => {
    const r = await axios.get('https://api.openligadb.de/getmatchdata/bl1');
    cache.set('current', r.data, 90 * 1000);
    const liveCount = r.data.filter(
      g => !g.matchIsFinished && new Date(g.matchDateTimeUTC) < new Date()
    ).length;
    if (liveCount > 0) console.log(`🔴 ${liveCount} Spiel(e) live`);
  });

  // Tabelle alle 15 Minuten
  schedule('Tabelle', 15 * 60 * 1000, async () => {
    const r = await axios.get('https://api.openligadb.de/getbltable/bl1/2025');
    cache.set('table', r.data, 14 * 60 * 1000);
    console.log('✅ Tabelle aktualisiert');
  });

  // Torjäger alle 30 Minuten
  schedule('Torjäger', 30 * 60 * 1000, async () => {
    const currentRes = await axios.get('https://api.openligadb.de/getcurrentgroup/bl1');
    const currentMatchday = currentRes.data?.groupOrderID || 33;
    const matchdays = Array.from({ length: Math.min(currentMatchday, 34) }, (_, i) => i + 1);
    const responses = await Promise.all(
      matchdays.map(md =>
        axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`)
          .then(r => r.data).catch(() => [])
      )
    );
    const scorerMap = {};
    responses.flat().forEach(match => {
      (match.goals || []).forEach(goal => {
        if (!goal.goalGetterName?.trim()) return;
        const name = goal.goalGetterName;
        const team = goal.isOwnGoal
          ? (match.team2?.shortName || match.team2?.teamName)
          : (match.team1?.shortName || match.team1?.teamName);
        if (!scorerMap[name]) scorerMap[name] = { name, team, goals: 0, penalties: 0, ownGoals: 0 };
        if (goal.isOwnGoal) scorerMap[name].ownGoals++;
        else { scorerMap[name].goals++; if (goal.isPenalty) scorerMap[name].penalties++; }
      });
    });
    const sorted = Object.values(scorerMap).filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 30);
    cache.set('scorers', sorted, 29 * 60 * 1000);
    console.log(`✅ Torjäger aktualisiert (${sorted.length} Einträge)`);
  });

  console.log('🟢 Scheduler läuft');
};
