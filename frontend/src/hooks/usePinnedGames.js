import { useLocalStorage } from './useLocalStorage';

export function usePinnedGames() {
  const [pinned, setPinned] = useLocalStorage('sn_pinned_games', []);

  function isPinned(matchId) {
    return pinned.includes(matchId);
  }

  function toggle(matchId) {
    setPinned(prev =>
      prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  }

  return { pinned, isPinned, toggle };
}
