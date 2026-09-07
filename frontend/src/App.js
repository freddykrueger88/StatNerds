import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard  from './pages/Dashboard';
import Games      from './pages/Games';
import Table      from './pages/Table';
import Scorers    from './pages/Scorers';
import Teams      from './pages/Teams';
import TeamStats  from './pages/TeamStats';
import Search     from './pages/Search';
import SeasonCompare from './pages/SeasonCompare';
import Settings   from './pages/Settings';
import Compare    from './pages/Compare';
import Picks      from './pages/Picks';
import History    from './pages/History';
import GlobalSearch      from './components/GlobalSearch';
import NotificationToggle from './components/NotificationToggle';
import { useFetch }       from './hooks/useFetch';
import { getHealth }      from './services/api';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  SPORTS, leagueSport, leaguesForSport,
  defaultLeagueForSport, sportColor,
} from './leagues';

const DEFAULT_THEME = { name: 'Bundesliga', primary: '#E32221', secondary: '#000000' };

// Light-Mode (Issue #7): ganzer Bereich wird invertiert, Bilder/Video werden
// über eine Doppel-Invert-Regel wieder korrekt dargestellt. Kein CSS auf dem
// Root, damit position:fixed-Elemente (Mobile-Nav) am Viewport bleiben.
const LIGHT_FILTER = 'invert(1) hue-rotate(180deg)';

const NAV = {
  football: [
    { id: 'dashboard',  label: '🏠',   tKey: 'nav.dashboard'    },
    { id: 'games',      label: '⚽',   tKey: 'nav.games'        },
    { id: 'table',      label: '📊',   tKey: 'nav.table'        },
    { id: 'scorers',    label: '🥅',   tKey: 'nav.scorers'      },
    { id: 'compare',    label: '⚖️',  tKey: 'nav.compare',     mobile: false },
    { id: 'seasoncmp',  label: '📅',   tKey: 'nav.seasoncmp',   mobile: false },
    { id: 'search',     label: '🔍',   tKey: 'nav.search',      mobile: false },
    { id: 'teamstats',  label: '📈',   tKey: 'nav.teamstats',   mobile: false },
    { id: 'teams',      label: '🏙️',  tKey: 'nav.teams'        },
    { id: 'picks',      label: '🎯',   tKey: 'nav.picks',       mobile: false },
    { id: 'history',    label: '🕘',   tKey: 'nav.history',     mobile: false },
    { id: 'settings',   label: '⚙️',   tKey: 'nav.settings'     },
  ],
  basketball: [
    { id: 'dashboard',  label: '🏠',   tKey: 'nav.dashboard'    },
    { id: 'games',      label: '🏀',   tKey: 'nav.games'        },
    { id: 'table',      label: '📊',   tKey: 'nav.table'        },
    { id: 'teams',      label: '🏙️',  tKey: 'nav.teams'        },
    { id: 'history',    label: '🕘',   tKey: 'nav.history',     mobile: false },
    { id: 'settings',   label: '⚙️',   tKey: 'nav.settings'     },
  ],
  tennis: [
    { id: 'dashboard',  label: '🏠',   tKey: 'nav.dashboard'    },
    { id: 'games',      label: '🎾',   tKey: 'nav.games'        },
    { id: 'table',      label: '🏆',   tKey: 'nav.tennis_table' },
    { id: 'teams',      label: '👤',   tKey: 'nav.teams'        },
    { id: 'history',    label: '🕘',   tKey: 'nav.history',     mobile: false },
    { id: 'settings',   label: '⚙️',   tKey: 'nav.settings'     },
  ],
};

export default function App() {
  const { t } = useTranslation();
  const [view, setView] = useState('dashboard');
  const [theme, setTheme] = useLocalStorage('sn_theme', DEFAULT_THEME);
  const [league, setLeague] = useLocalStorage('sn_league', 'bl1');
  const { data: healthData } = useFetch(() => getHealth(), 60_000);
  const health = healthData?.status || null;

// Issue #7: Dark/Light-Mode. Default folgt der System-Präferenz; Auswahl
// wird in sn_mode persistiert. (useLocalStorage hat keine Funktions-
// Initializer → Default vor dem Hook-Aufruf berechnen.)
const systemLight = typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
const [mode, setMode] = useLocalStorage('sn_mode', systemLight ? 'light' : 'dark');
const light = mode === 'light';
const lightStyle = light ? { filter: LIGHT_FILTER } : {};

// Issue #42: Schriftgröße. Die meisten Größen nutzen rem → Änderung der
// HTML-Basisgröße skaliert die komplette UI ohne Layout-Knochen.
const FONT_SIZES = { small: '14px', normal: '16px', large: '18px' };
const [fontSize, setFontSize] = useLocalStorage('sn_font_size', 'normal');
useEffect(() => {
  document.documentElement.style.fontSize = FONT_SIZES[fontSize] || FONT_SIZES.normal;
}, [fontSize]);

// Issue #24: Fokus-Modus – reduzierte, reizarme Darstellung (ADHS/kognitiv).
const [focusMode, setFocusMode] = useLocalStorage('sn_focus_mode', false);

  const sport = leagueSport(league);
  const nav = NAV[sport] || NAV.football;
  const effectiveView = nav.some(n => n.id === view) ? view : 'dashboard';

  const onSportChange = nextSport => {
    setView('dashboard');
    setLeague(defaultLeagueForSport(nextSport));
  };

  // Per-Sport-Theme: football nutzt das gewählte Theme, sonst Sport-Akzent.
  const accent = sportColor(sport);
  const effectiveTheme = accent ? { ...theme, primary: accent, secondary: '#000000' } : theme;

  return (
    <div className={`${light ? 'sn-light ' : ''}${focusMode ? 'sn-focus' : ''}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#0f0f0f', color: '#fff', minHeight: '100dvh' }}>
      {/* Issue #24: Skip-Link – „Zum Inhalt springen“ für Tastatur-/Screenreader-Nutzer */}
      <a href="#main-content"
        style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
        onFocus={e => e.target.style.cssText = 'position:absolute;left:0.5rem;top:0.5rem;z-index:9999;background:#fff;color:#000;padding:0.5rem 1rem;border-radius:6px;font-weight:bold;text-decoration:none;'}
        onBlur={e => e.target.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;'}>
        🔗 Zum Inhalt springen
      </a>
      <nav aria-label='Hauptnavigation' style={{
        background: '#1a1a1a', borderBottom: `2px solid ${effectiveTheme.primary}`,
        padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
        position: 'sticky', top: 0, zIndex: 100, ...lightStyle,
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '1rem', marginRight: '0.2rem', color: effectiveTheme.primary, whiteSpace: 'nowrap' }}>📊 StatNerds</span>
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1, flexWrap: 'wrap' }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} aria-label={effectiveView === n.id ? `${t(n.tKey)} (aktiv)` : t(n.tKey)} style={{
              background: effectiveView === n.id ? effectiveTheme.primary : 'transparent',
              color: effectiveView === n.id ? '#fff' : '#666',
              border: 'none', borderRadius: '6px',
              padding: '0.45rem 0.55rem', cursor: 'pointer', minHeight: '44px',
              fontWeight: effectiveView === n.id ? 'bold' : 'normal', fontSize: '0.82rem'
            }}>
              <span aria-hidden='true'>{n.label}</span>
              {n.tKey && <span className='nav-label' style={{ marginLeft: '0.2rem' }}>{t(n.tKey)}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <GlobalSearch theme={effectiveTheme} onNavigate={(v, l) => { if (l) setLeague(l); setView(v); }} />
          <select value={sport} onChange={e => onSportChange(e.target.value)} title='Sportart wählen'
            style={{ background: '#111', color: '#aaa', border: '1px solid #333', borderRadius: '6px', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}>
            {SPORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={league} onChange={e => setLeague(e.target.value)} title='Liga wählen'
            style={{ background: '#111', color: '#aaa', border: '1px solid #333', borderRadius: '6px', padding: '0.25rem 0.4rem', fontSize: '0.78rem', maxWidth: '120px' }}>
            {leaguesForSport(sport).map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          {sport !== 'football' && <span title='ESPN Public API (keyless) – ohne API-Key' style={{ fontSize: '0.65rem', color: '#555' }}>ESPN</span>}
          <button onClick={() => setMode(m => (m === 'light' ? 'dark' : 'light'))}
            title={light ? 'Dunkelmodus aktivieren' : 'Hellmodus aktivieren'}
            aria-label={light ? 'Dunkelmodus aktivieren' : 'Hellmodus aktivieren'}
            style={{ background: 'none', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', padding: '0.15rem 0.4rem', lineHeight: 1 }}>
            {light ? '🌙' : '☀️'}
          </button>
          <button onClick={() => setFontSize(f => f === 'small' ? 'normal' : f === 'normal' ? 'large' : 'small')}
            title={`Schriftgröße: ${fontSize === 'small' ? 'Klein' : fontSize === 'large' ? 'Groß' : 'Normal'} (wechseln)`}
            aria-label='Schriftgröße wechseln'
            style={{ background: 'none', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontStyle: 'italic', fontWeight: 'bold', padding: '0.05rem 0.45rem', lineHeight: 1, fontSize: '0.8rem', color: '#ccc' }}>
            Aa
          </button>
          <NotificationToggle theme={effectiveTheme} league={league} />
          <span style={{ fontSize: '0.65rem', color: health === 'OK' ? '#4ade80' : '#f87171' }}>⬤ {health || '...'}</span>
        </div>
      </nav>

      <main id='main-content' style={{ padding: '0.75rem', maxWidth: '960px', margin: '0 auto', paddingBottom: '5rem', ...lightStyle }} className='page-fade sn-mid'>
        {effectiveView === 'dashboard' && <Dashboard  theme={effectiveTheme} onNavigate={(v, l) => { if (l) setLeague(l); setView(v); }} />}
        {effectiveView === 'games'     && <Games     theme={effectiveTheme} league={league} />}
        {effectiveView === 'table'     && <Table     theme={effectiveTheme} league={league} />}
        {effectiveView === 'scorers'   && <Scorers   theme={effectiveTheme} league={league} />}
        {effectiveView === 'search'    && <Search    theme={effectiveTheme} league={league} />}
        {effectiveView === 'teamstats' && <TeamStats theme={effectiveTheme} league={league} />}
        {effectiveView === 'teams'     && <Teams     theme={effectiveTheme} league={league} />}
        {effectiveView === 'compare'   && <Compare   theme={effectiveTheme} league={league} />}
        {effectiveView === 'picks'     && <Picks     theme={effectiveTheme} league={league} />}
        {effectiveView === 'seasoncmp' && <SeasonCompare theme={effectiveTheme} league={league} />}
        {effectiveView === 'history'   && <History   theme={effectiveTheme} league={league}
          onNavigate={(v, l) => { if (l) setLeague(l); setView(v); }} />}
        {effectiveView === 'settings'  && <Settings  theme={effectiveTheme} setTheme={setTheme} mode={mode} setMode={setMode} fontSize={fontSize} setFontSize={setFontSize} focusMode={focusMode} setFocusMode={setFocusMode} />}
      </main>

      <nav aria-label='Mobile Navigation' className='mobile-bottom-nav' style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a1a', borderTop: `2px solid ${effectiveTheme.primary}`,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '0.4rem 0 calc(0.4rem + env(safe-area-inset-bottom))',
        zIndex: 200, ...lightStyle,
      }}>
        {nav.filter(n => n.mobile !== false).map(n => (
          <button key={n.id} onClick={() => setView(n.id)} aria-label={n.tKey ? t(n.tKey) : effectiveView === n.id ? `${n.label} (aktiv)` : n.label} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            padding: '0.2rem 0.4rem', minWidth: '44px', minHeight: '44px',
            color: effectiveView === n.id ? effectiveTheme.primary : '#555',
          }}>
            <span aria-hidden='true'>{n.label}</span>
            {n.tKey && <span style={{ fontSize: '0.5rem', fontWeight: effectiveView === n.id ? 'bold' : 'normal' }}>{t(n.tKey)}</span>}
          </button>
        ))}
      </nav>

      <style>{`
        @media (min-width: 600px) { .mobile-bottom-nav { display: none !important; } }
        @media (max-width: 599px) { .nav-label { display: none; } }
        @media (max-width: 599px) { .gs-input { width: 120px !important; } }
        @keyframes pageFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .page-fade { animation: pageFade 0.22s ease-out; }
        @media (prefers-reduced-motion: reduce) { .page-fade { animation: none; } }

        /* Issue #8: Tor-Flash einer Spielkarte */
        @keyframes sn-goal-flash {
          0%   { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); background: #1a1a2e; }
          18%  { box-shadow: 0 0 30px 10px rgba(250, 204, 21, 0.6); background: #2a2711; }
          100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
        }
        @media (prefers-reduced-motion: reduce) { .sn-flashcard { animation: none !important; } }

        /* Issue #7: Light-Mode – Bilder doppelt invertieren, damit Logos/Fotos
           trotz umgekehrtem Bereich korrekt bleiben. */
        .sn-light img, .sn-light video, .sn-light iframe { filter: invert(1) hue-rotate(180deg); }

        /* Issue #24: a11y – sichtbarer Fokus-Indikator (WCAG AA, 3:1) */
        :focus { outline: 2px solid #4f8cff; outline-offset: 2px; }
        :focus:not(:focus-visible) { outline: none; }
        /* Touch-Ziele ≥ 44x44 auf interaktiven Mobile-Elementen */
        @media (max-width: 599px) {
          button, a, select { min-height: 44px; }
        }
        /* Zeilenabstand ≥ 1.5 für Fließtext; klare Schrift */
        p, li, .sn-mid { line-height: 1.5; }

        /* Issue #24: Fokus-Modus – reizarme Darstellung ohne Animationen/Flashs */
        .sn-focus * { animation: none !important; transition: none !important; }
        .sn-focus .sn-flashcard, .sn-focus [style*='box-shadow'] { box-shadow: none !important; }
        .sn-focus img { opacity: 0.85; }
        .sn-focus .mobile-bottom-nav { opacity: 0.92; }
      `}</style>
    </div>
  );
}
