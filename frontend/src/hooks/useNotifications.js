import { useEffect, useRef, useState, useCallback } from 'react';

const POLL_INTERVAL = 60 * 1000; // 1 min

export default function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [watching, setWatching] = useState(
    () => localStorage.getItem('sn_notify') === 'true'
  );
  const goalSnapshotRef = useRef(null);
  const timerRef = useRef(null);

  // Service Worker registrieren
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendNotification = useCallback((title, body, tag = 'goal') => {
    if (permission !== 'granted') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag,
          vibrate: [200, 100, 200],
        });
      });
    } else {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  }, [permission]);

  // Tor-Polling
  const pollGoals = useCallback(async () => {
    try {
      const r = await fetch('/api/games/bl1/current');
      const games = await r.json();
      if (!Array.isArray(games)) return;

      const liveGames = games.filter(g => !g.matchIsFinished);
      const snapshot = {};
      liveGames.forEach(g => { snapshot[g.matchID] = g.goals?.length || 0; });

      if (goalSnapshotRef.current !== null) {
        liveGames.forEach(g => {
          const prev = goalSnapshotRef.current[g.matchID] ?? 0;
          const curr = snapshot[g.matchID];
          if (curr > prev) {
            const newGoals = (g.goals || []).slice(prev);
            newGoals.forEach(goal => {
              const t1 = g.team1?.shortName || g.team1?.teamName;
              const t2 = g.team2?.shortName || g.team2?.teamName;
              sendNotification(
                `⚽ TOR! ${t1} – ${t2}`,
                `${goal.goalGetterName} ${goal.matchMinute}' (${goal.scoreTeam1}:${goal.scoreTeam2})${goal.isPenalty ? ' [Elfmeter]' : ''}${goal.isOwnGoal ? ' [Eigentor]' : ''}`,
                `goal_${g.matchID}`
              );
            });
          }
        });
      }
      goalSnapshotRef.current = snapshot;
    } catch {}
  }, [sendNotification]);

  useEffect(() => {
    if (watching && permission === 'granted') {
      pollGoals();
      timerRef.current = setInterval(pollGoals, POLL_INTERVAL);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [watching, permission, pollGoals]);

  const toggle = useCallback(async () => {
    if (!watching) {
      let perm = permission;
      if (perm === 'default') perm = await requestPermission();
      if (perm !== 'granted') return false;
      goalSnapshotRef.current = null;
      setWatching(true);
      localStorage.setItem('sn_notify', 'true');
      return true;
    } else {
      setWatching(false);
      localStorage.setItem('sn_notify', 'false');
      return false;
    }
  }, [watching, permission, requestPermission]);

  return { permission, watching, toggle, sendNotification };
}
