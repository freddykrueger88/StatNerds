import { useLocalStorage } from './useLocalStorage';

/**
 * Verwaltet eine Liste favorisierter Vereins-IDs.
 * Verwendung:
 *   const { favorites, toggle, isFavorite } = useFavorites();
 */
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage('sn_favorites', []);

  function toggle(teamId) {
    setFavorites(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  }

  function isFavorite(teamId) {
    return favorites.includes(teamId);
  }

  function clear() {
    setFavorites([]);
  }

  return { favorites, toggle, isFavorite, clear };
}
