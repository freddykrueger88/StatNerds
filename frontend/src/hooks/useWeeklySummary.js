import { useEffect, useRef } from 'react';
import { getWeeklySummary } from '../services/api';
import { useLocalStorage } from './useLocalStorage';
import { useFavorites } from './useFavorites';

// Wöchentliche Ergebnis-Zusammenfassung (Issue #14):
// prüft beim App-Start (und minütlich, wenn die App läuft) ob es Montag
// vor 12 Uhr ist und die Zusammenfassung dieser Woche noch nicht versendet
// wurde. Versenden läuft über die registrierte Service-Worker-Notification.
export default function useWeeklySummary(config = null, sendNotification = null) {
  const [lastSent, setLastSent] = useLocalStorage('sn_weekly_last', '');
  const { favorites } = useFavorites();
  const sentRef = useRef(lastSent);
  sentRef.current = lastSent;

  useEffect(() => {
    const enabled = !!config?.weekly && typeof sendNotification === 'function';
    if (!enabled) return undefined;

    const send = async () => {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') return;
      const now = new Date();
      // Montag 00:00 – 12:00 Uhr
      if (now.getDay() !== 1) return;
      const weekKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      if (sentRef.current === weekKey) return;

      try {
        const leagues = Array.isArray(config.leagues) && config.leagues.length ? config.leagues : ['bl1'];
        const favs = config.onlyFavorites && favorites.length ? favorites : [];
        const data = await getWeeklySummary(leagues, favs, 7);
        const results = Array.isArray(data?.results) ? data.results : [];
        setLastSent(weekKey);
        sentRef.current = weekKey;
        if (!results.length) return;

        const wins = results.filter(r => r.homeGoals !== r.awayGoals);
        const header = `📋 Wochen-Zusammenfassung`;
        const lines = results.slice(0, 8).map(r =>
          `${r.home} ${r.homeGoals}:${r.awayGoals} ${r.away}`
        );
        if (results.length > 8) lines.push(`… +${results.length - 8} weitere`);
        sendNotification(header, lines.join('\n'), `statnerds:weekly:${weekKey}`);
      } catch (e) { /* Stille, nicht blockieren */ }
    };

    send();
    const t = setInterval(send, 60 * 1000);
    return () => clearInterval(t);
  }, [config, favorites, sendNotification, setLastSent]);
}
