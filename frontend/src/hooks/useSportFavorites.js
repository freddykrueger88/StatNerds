import { useLocalStorage } from './useLocalStorage';

/**
 * Verwaltet eine Liste favorisierter IDs für eine beliebige Persistenz-Kategorie
 * (z.B. NBA-Franchises 'sn_fav_nba', Tennis-Spieler 'sn_fav_tennis').
 * Verwendung:
 *   const { favorites, toggle, isFavorite, clear } = useSportFavorites('sn_fav_nba');
 */
export function useSportFavorites(key) {
  const [favorites, setFavorites] = useLocalStorage(key, []);

  function toggle(id) {
    setFavorites(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  }

  function isFavorite(id) {
    return favorites.includes(id);
  }

  function clear() {
    setFavorites([]);
  }

  return { favorites, toggle, isFavorite, clear };
}
