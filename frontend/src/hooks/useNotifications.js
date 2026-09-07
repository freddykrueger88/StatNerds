import { useEffect, useRef, useState, useCallback } from 'react';
import { getCurrentGames } from '../services/api';
import { useLocalStorage } from './useLocalStorage';
import { useFavorites } from './useFavorites';

const POLL_INTERVAL = 60 * 1000;

const typeLabels = { goals: '⚽', kickoff: '🏁', final: '🚩' };

export default function useNotifications(league = 'bl1', config = null) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [watching, setWatching] = useLocalStorage('sn_notify', false);
  const { favorites } = useFavorites();
  const snapshotRef = useRef({});
  const timerRef    = useRef(null);

  const cfg = {
    types: Array.isArray(config?.types) && config.types.length ? config.types : [], // [] = nichts
    leagues: Array.isArray(config?.leagues) && config.leagues.length ? config.leagues : [league],
    onlyFavorites: !!config?.onlyFavorites,
  };

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

  const sendNotification = useCallback((title, body, tag) => {
    if (permission !== 'granted') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body, icon: '/icon-192.png', badge: '/icon-192.png',
          tag, vibrate: [200, 100, 200],
        });
      });
    } else {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  }, [permission]);

  const relevant = useCallback(g => {
    if (!cfg.onlyFavorites) return true;
    const t1 = g.team1?.teamId;
    const t2 = g.team2?.teamId;
    return favorites.includes(t1) || favorites.includes(t2);
  }, [cfg.onlyFavorites, favorites]);

  const pollOnce = useCallback(async () => {
    const byLeague = await Promise.all(
      cfg.leagues.map(async l => {
        try {
          const games = await getCurrentGames(l);
          return Array.isArray(games) ? games.map(g => ({ league: l, game: g })) : [];
        } catch { return []; }
      })
    );
    const entries = byLeague.flat();
    const snapshot = {};

    entries.forEach(({ league: l, game: g }) => {
      const id = String(g.matchID);
      const goalsNow  = g.goals?.length || 0;
      const isFinished = !!g.matchIsFinished;
      const start = new Date(g.matchDateTimeUTC || g.matchDateTime).getTime();
      const started = !isFinished && start <= Date.now() && start > 0;

      const prev = snapshotRef.current[id] || {};
      snapshotRef.current[id] = { goals: goalsNow, finished: isFinished, started, league: l };
      snapshot[id] = true;

      if (!relevant(g)) return;
      if (permission !== 'granted') return;

      if (cfg.types.includes('goals') && prev.goals !== undefined && goalsNow > prev.goals) {
        (g.goals || []).slice(prev.goals).forEach(goal => {
          const t1 = g.team1?.shortName || g.team1?.teamName;
          const t2 = g.team2?.shortName || g.team2?.teamName;
          sendNotification(
            `${typeLabels.goals} TOR! ${t1} – ${t2}`,
            `${goal.goalGetterName} ${goal.matchMinute}' (${goal.scoreTeam1}:${goal.scoreTeam2})${goal.isPenalty ? ' [Elfmeter]' : ''}${goal.isOwnGoal ? ' [Eigentor]' : ''}`,
            `statnerds:goal:${id}`
          );
        });
      }
      if (cfg.types.includes('kickoff') && !prev.started && started) {
        const t1 = g.team1?.shortName || g.team1?.teamName;
        const t2 = g.team2?.shortName || g.team2?.teamName;
        sendNotification(`${typeLabels.kickoff} Anpfiff: ${t1} – ${t2}`, `${g.group?.groupName || ''}`, `statnerds:kickoff:${id}`);
      }
      if (cfg.types.includes('final') && !prev.finished && isFinished) {
        const t1 = g.team1?.shortName || g.team1?.teamName;
        const t2 = g.team2?.shortName || g.team2?.teamName;
        const res = (g.matchResults || []).find(r => r.resultTypeID === 2);
        const score = res ? `${res.pointsTeam1}:${res.pointsTeam2}` : '';
        sendNotification(`${typeLabels.final} Abpfiff`, `${t1} – ${t2} ${score}`, `statnerds:final:${id}`);
      }
    });

    // Aufgeräumte Snapshot-Tabelle: alle vorher bekannten Ids, die aktuell nicht
    // mehr im Fenster liegen, für spätere "Anpfiff"-Erkennung zurücksetzen.
    Object.keys(snapshotRef.current).forEach(id => {
      if (!snapshot[id]) delete snapshotRef.current[id];
    });
  }, [cfg.leagues, cfg.types, cfg.onlyFavorites, permission, relevant, sendNotification]);

  useEffect(() => {
    if (watching && permission === 'granted') {
      pollOnce();
      timerRef.current = setInterval(pollOnce, POLL_INTERVAL);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [watching, permission, pollOnce]);

  const toggle = useCallback(async () => {
    if (!watching) {
      let perm = permission;
      if (perm === 'default') perm = await requestPermission();
      if (perm !== 'granted') return false;
      snapshotRef.current = {};
      setWatching(true);
      return true;
    } else {
      setWatching(false);
      return false;
    }
  }, [watching, permission, requestPermission, setWatching]);

  return { permission, watching, toggle, sendNotification };
}
