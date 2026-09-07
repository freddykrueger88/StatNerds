import { useLocalStorage } from './useLocalStorage';

export const NOTIFY_TYPES = [
  { id: 'goals',  label: '⚽ Tore'      },
  { id: 'kickoff', label: '🏁 Anpfiff'  },
  { id: 'final',  label: '🚩 Abpfiff'   },
];

export const NOTIFY_LEAGUES = [
  { id: 'bl1',  label: '1. Bundesliga'     },
  { id: 'bl2',  label: '2. Bundesliga'     },
  { id: 'fbl1', label: 'Frauen-Bundesliga' },
  { id: 'bbl',  label: 'Basketball-Bundesliga' },
];

export const DEFAULT_NOTIFY_CONFIG = {
  types: ['goals'],
  leagues: ['bl1', 'bl2', 'fbl1', 'bbl'],
  onlyFavorites: false,
};

export function useNotifyConfig() {
  return useLocalStorage('sn_notify_config', DEFAULT_NOTIFY_CONFIG);
}
