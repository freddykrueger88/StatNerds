import { useState, useEffect } from 'react';

/**
 * Gibt die verbleibende Zeit bis targetDate zurück.
 * Aktualisiert sich jede Sekunde automatisch.
 * Gibt null zurück wenn das Datum in der Vergangenheit liegt.
 */
export function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!targetDate) return;

    function calc() {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setRemaining(null); return; }

      const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemaining({ days, hours, minutes, seconds, diff });
    }

    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [targetDate]);

  return remaining;
}

/**
 * Formatiert das Countdown-Objekt als lesbaren String.
 * z.B. "2T 4Std 32Min" oder "45Min 12Sek"
 */
export function formatCountdown(remaining) {
  if (!remaining) return null;
  const { days, hours, minutes, seconds } = remaining;
  if (days > 0)    return `${days}T ${hours}Std ${minutes}Min`;
  if (hours > 0)   return `${hours}Std ${minutes}Min`;
  if (minutes > 0) return `${minutes}Min ${seconds}Sek`;
  return `${seconds}Sek`;
}
