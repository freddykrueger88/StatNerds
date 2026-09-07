import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFavorites } from '../hooks/useFavorites';
import { useNotifyConfig, NOTIFY_TYPES, NOTIFY_LEAGUES } from '../hooks/useNotifyConfig';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { cleanupStats } from '../services/api';

const APP_VERSION = process.env.REACT_APP_VERSION || '0.6.0';
const GITHUB_URL  = 'https://github.com/freddykrueger88/StatNerds';

const THEMES = [
  { name: 'Bundesliga',               primary: '#E32221', secondary: '#000000', emoji: '⭐' },
  { name: 'FC Bayern',                primary: '#ED1C24', secondary: '#FFFFFF', emoji: '🔴' },
  { name: 'BVB Dortmund',             primary: '#FCEA10', secondary: '#000000', emoji: '🟡' },
  { name: 'Bayer Leverkusen',         primary: '#E32221', secondary: '#000000', emoji: '🔴' },
  { name: 'RB Leipzig',               primary: '#DD0741', secondary: '#001E62', emoji: '🔴' },
  { name: 'Eintracht Frankfurt',      primary: '#E1000F', secondary: '#000000', emoji: '🧥' },
  { name: 'VfB Stuttgart',            primary: '#E32221', secondary: '#FFFFFF', emoji: '🔴' },
  { name: 'Werder Bremen',            primary: '#1D9253', secondary: '#FFFFFF', emoji: '🟢' },
  { name: 'Borussia Mönchengladbach', primary: '#00A550', secondary: '#000000', emoji: '🟢' },
  { name: 'Schalke 04',               primary: '#004D9D', secondary: '#FFFFFF', emoji: '🔵' },
  { name: 'HSV',                      primary: '#0B1F69', secondary: '#FFFFFF', emoji: '🔵' },
  { name: 'FC Augsburg',              primary: '#BA3733', secondary: '#FFFFFF', emoji: '🔴' },
  { name: '1. FC Köln',               primary: '#ED1C24', secondary: '#FFFFFF', emoji: '🐐' },
  { name: 'FSV Mainz 05',             primary: '#C8102E', secondary: '#FFFFFF', emoji: '🔴' },
  { name: 'SC Freiburg',              primary: '#E32221', secondary: '#000000', emoji: '🔴' },
  { name: 'Union Berlin',             primary: '#EB1923', secondary: '#000000', emoji: '🔴' },
  { name: 'VfL Bochum',               primary: '#005CA8', secondary: '#FFFFFF', emoji: '🔵' },
  { name: 'VfL Wolfsburg',            primary: '#65B32E', secondary: '#004D93', emoji: '🟢' },
  { name: 'Nacht (Dark)',             primary: '#6366f1', secondary: '#1e1b4b', emoji: '🌙' },
];

const FAVORITE_TEAMS = [
  'Kein Favorit',
  ...THEMES.filter(t => t.name !== 'Bundesliga' && t.name !== 'Nacht (Dark)').map(t => t.name)
];

const API_KEY_DEFS = [
  {
    id: 'api_football',
    label: 'API-Football',
    description: 'Live-Stats, xG, Schiedsrichter, TV-Sender, Spielerinfos',
    placeholder: 'z.B. a1b2c3d4e5f6...',
    url: 'https://dashboard.api-football.com/register',
    urlLabel: 'Kostenlos registrieren (100 Req/Tag)',
    free: true,
  },
  {
    id: 'sportsdb',
    label: 'TheSportsDB',
    description: 'Vereinslogos, Stadionfotos, Spielerbilder, Vereinshistorie',
    placeholder: 'Patreon-Key oder leer lassen für Free-Tier',
    url: 'https://www.thesportsdb.com/api.php',
    urlLabel: 'API-Info & Patreon-Key',
    free: true,
  },
  {
    id: 'football_data',
    label: 'Football-Data.org',
    description: 'Internationale Ligen, Champions League, Premier League',
    placeholder: 'Dein Football-Data API-Key...',
    url: 'https://www.football-data.org/client/register',
    urlLabel: 'Kostenlos registrieren',
    free: true,
  },
  {
    id: 'rapidapi',
    label: 'RapidAPI (Sport)',
    description: 'Zusätzliche Sport-APIs über RapidAPI-Hub',
    placeholder: 'Dein RapidAPI-Key...',
    url: 'https://rapidapi.com/hub',
    urlLabel: 'RapidAPI Hub → Sport-Kategorie',
    free: false,
  },
];

const CLEANUP_OPTIONS = [
  { label: 'Statistiken älter als 7 Tage',           days: 7  },
  { label: 'Statistiken älter als 14 Tage',          days: 14 },
  { label: 'Statistiken älter als 30 Tage',          days: 30 },
  { label: 'Alle gespeicherten Statistiken löschen', days: 0  },
];

const COUNTRIES = [
  { code: 'DE', label: '🇩🇪 Deutschland' },
  { code: 'AT', label: '🇦🇹 Österreich'   },
  { code: 'CH', label: '🇨🇭 Schweiz'      },
  { code: 'GB', label: '🇬🇧 UK'           },
  { code: 'US', label: '🇺🇸 USA'          },
];

// Jeder Key bekommt einen eigenen Hook – keine Hooks in Schleifen
function useApiKeys() {
  const [k0, s0] = useLocalStorage('sn_key_api_football',  '');
  const [k1, s1] = useLocalStorage('sn_key_sportsdb',      '');
  const [k2, s2] = useLocalStorage('sn_key_football_data', '');
  const [k3, s3] = useLocalStorage('sn_key_rapidapi',      '');
  return {
    keys:    { api_football: k0, sportsdb: k1, football_data: k2, rapidapi: k3 },
    setters: { api_football: s0, sportsdb: s1, football_data: s2, rapidapi: s3 },
  };
}

export default function Settings({ theme, setTheme, mode, setMode, fontSize, setFontSize, focusMode, setFocusMode }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { keys, setters }               = useApiKeys();
  const [draftKeys, setDraftKeys]       = useState(() => ({ ...keys }));
  const [savedMsg,  setSavedMsg]        = useState({});
  const [cleanupDays, setCleanupDays]   = useState(30);
  const [cleanupMsg,  setCleanupMsg]    = useState('');
  const [adminKey]                      = useLocalStorage('sn_admin_key', '');
  const [favoriteTeam, setFavoriteTeam] = useLocalStorage('sn_favorite_team', 'Kein Favorit');
  const [favSaved, setFavSaved]         = useState(false);
  const [country, setCountry]           = useLocalStorage('sn_country', 'DE');
  const [notifyConfig, setNotifyConfig] = useNotifyConfig();
  const { favorites, setFavorites }     = useFavorites();
  const [league, setLeague]             = useLocalStorage('sn_league', 'bl1');
  const auth                            = useAuth();
  const [authEmail, setAuthEmail]       = useState('');
  const [authPass,  setAuthPass]        = useState('');
  const [authMsg,   setAuthMsg]         = useState('');

  // Lokale Einstellungen/Favoriten → Server-Format (Issue #15)
  const localSettings = () => ({
    favorites: favorites,
    theme: theme,
    notifyConfig: notifyConfig,
    mode: mode,
    fontSize: fontSize,
    league: league,
  });

  // Server-Settings → lokale Setter (Issue #15)
  const serverSetters = {
    favorites: setFavorites,
    theme: setTheme,
    notifyConfig: setNotifyConfig,
    mode: setMode,
    fontSize: setFontSize,
    league: setLeague,
  };

  const handleAuth = async (kind) => {
    if (!authEmail.trim() || authPass.length < 8) {
      setAuthMsg('❌ ' + t('accounts.invalidForm'));
      return;
    }
    const result = kind === 'register'
      ? await auth.register(authEmail, authPass, localSettings(), serverSetters)
      : await auth.login(authEmail, authPass, localSettings(), serverSetters);
    setAuthMsg(result.ok ? '✅ ' + (result.messageKey ? t(result.messageKey) : result.message)
      : '❌ ' + result.message);
    if (result.ok) { setAuthPass(''); }
  };

  const saveFavorite = (teamName) => {
    setFavoriteTeam(teamName);
    if (teamName !== 'Kein Favorit') {
      const matchTheme = THEMES.find(t => t.name === teamName);
      if (matchTheme) setTheme(matchTheme);
    }
    setFavSaved(true);
    setTimeout(() => setFavSaved(false), 2000);
  };

  const saveKey = (id) => {
    setters[id](draftKeys[id]);
    setSavedMsg(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setSavedMsg(prev => ({ ...prev, [id]: false })), 2000);
  };

  const handleCleanup = async () => {
    if (!window.confirm(`Wirklich löschen (${cleanupDays === 0 ? 'ALLE' : 'älter als ' + cleanupDays + ' Tage'})?`)) return;
    if (!adminKey) { setCleanupMsg('❌ Kein Admin-Key konfiguriert.'); return; }
    try {
      const d = await cleanupStats(cleanupDays, adminKey);
      setCleanupMsg(`✅ ${d.deleted} Einträge gelöscht.`);
    } catch (e) {
      setCleanupMsg(`❌ Fehler: ${e.message}`);
    }
    setTimeout(() => setCleanupMsg(''), 5000);
  };

  const block = { background: '#1a1a1a', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' };
  const lbl   = { color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' };

  return (
    <div style={{ maxWidth: '700px', paddingBottom: '3rem' }}>
      <h2 style={{ color: theme.primary }}>{t('settings.title')}</h2>

      {/* Sprache (Issue #16) */}
      <div style={{ ...block, borderLeft: `4px solid ${theme.primary}` }}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>{t('settings.language')}</h3>
        <span style={lbl}>{t('settings.languageHint')}</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'de', label: '🇩🇪 Deutsch' },
            { id: 'en', label: '🇬🇧 English' },
            { id: 'es', label: '🇪🇸 Español' },
          ].map(l => (
            <button key={l.id} onClick={() => setLanguage(l.id)} style={{
              background: language === l.id ? theme.primary + '22' : '#222',
              color: language === l.id ? '#fff' : '#aaa',
              border: `2px solid ${language === l.id ? theme.primary : '#2a2a2a'}`,
              borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer',
              fontWeight: language === l.id ? 'bold' : 'normal', fontSize: '0.85rem',
            }}>{l.label}</button>
          ))}
        </div>
      </div>

      {/* Benutzerkonto (Issue #15) */}
      <div style={{ ...block, borderLeft: `4px solid ${theme.primary}` }}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>{t('settings.account')}</h3>
        <span style={lbl}>
          {auth.loggedIn
            ? <>{t('settings.accountLoggedIn')} <strong>{auth.email}</strong>.</>
            : <span dangerouslySetInnerHTML={{ __html: t('settings.accountLoggedOut') }} />}
        </span>

        {!auth.loggedIn ? (
          <>
            <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <input type='email' placeholder={t('settings.emailPlaceholder')} value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  style={{ background: '#111', color: '#fff', border: `1px solid ${theme.primary}44`, borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }} />
                <input type='password' placeholder={t('settings.passwordPlaceholder')} value={authPass}
                  onChange={e => setAuthPass(e.target.value)}
                  style={{ background: '#111', color: '#fff', border: `1px solid ${theme.primary}44`, borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button onClick={() => handleAuth('login')} disabled={auth.busy}
                  style={{ background: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {auth.busy ? '…' : t('settings.login')}
                </button>
                <button onClick={() => handleAuth('register')} disabled={auth.busy}
                  style={{ background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}66`, borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  {auth.busy ? '…' : t('settings.register')}
                </button>
              </div>
            </div>
            <p style={{ color: '#555', fontSize: '0.78rem', margin: '0.5rem 0 0 0' }}>
              {t('settings.passwordNote')}
            </p>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button onClick={async () => { const r = await auth.syncToServer(localSettings()); setAuthMsg(r.ok ? '✅ ' + r.message : '❌ ' + r.message); }}
              style={{ background: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {t('settings.syncUp')}
            </button>
            <button onClick={async () => { const r = await auth.syncFromServer(serverSetters); setAuthMsg(r.ok ? '✅ ' + r.message : '❌ ' + r.message); }}
              style={{ background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}66`, borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              {t('settings.syncDown')}
            </button>
            <button onClick={() => { auth.logout(); setAuthMsg(t('accounts.loggedOut')); }}
              style={{ background: 'transparent', color: '#f87171', border: '1px solid #f8717166', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              {t('settings.logout')}
            </button>
          </div>
        )}
        {authMsg && <p style={{ fontSize: '0.82rem', color: authMsg.startsWith('✅') || authMsg.startsWith('👋') ? '#4ade80' : '#f87171', margin: '0.6rem 0 0 0' }}>{authMsg}</p>}
      </div>

      {/* Lieblingsverein */}
      <div style={{ ...block, borderLeft: `4px solid ${theme.primary}` }}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>{t('settings.myClub')}</h3>
        <span style={lbl}>{t('settings.myClubHint')}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={favoriteTeam} onChange={e => saveFavorite(e.target.value)}
            style={{ flex: 1, background: '#111', color: '#fff', border: `1px solid ${theme.primary}44`, borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.95rem', cursor: 'pointer' }}>
            {FAVORITE_TEAMS.map(t => (
              <option key={t} value={t}>{THEMES.find(th => th.name === t)?.emoji || '⚽'} {t}</option>
            ))}
          </select>
          {favSaved && <span style={{ color: '#4ade80', fontSize: '0.85rem' }}>✅ Gespeichert!</span>}
        </div>
        {favoriteTeam !== 'Kein Favorit' && (
          <p style={{ color: '#555', fontSize: '0.78rem', margin: '0.5rem 0 0 0' }}>
            Theme auf <strong style={{ color: theme.primary }}>{favoriteTeam}</strong> gesetzt.
          </p>
        )}
      </div>

      {/* Benachrichtigungen */}
      <div style={{ ...block, borderLeft: `4px solid ${theme.primary}` }}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>{t('settings.notifications')}</h3>
        <span style={lbl}>{t('settings.notificationsHint')}</span>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: '#999', fontSize: '0.78rem', marginBottom: '0.4rem' }}>{t('settings.eventTypes')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {NOTIFY_TYPES.map(t => {
              const active = notifyConfig.types.includes(t.id);
              return (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: active ? theme.primary + '22' : '#222', border: `1px solid ${active ? theme.primary : '#2a2a2a'}`,
                  borderRadius: '8px', padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type='checkbox' checked={active} style={{ accentColor: theme.primary }}
                    onChange={e => {
                      const types = e.target.checked ? [...notifyConfig.types, t.id] : notifyConfig.types.filter(x => x !== t.id);
                      setNotifyConfig({ ...notifyConfig, types });
                    }} />
                  {t.label}
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: '#999', fontSize: '0.78rem', marginBottom: '0.4rem' }}>{t('settings.leagues')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {NOTIFY_LEAGUES.map(l => {
              const active = notifyConfig.leagues.includes(l.id);
              return (
                <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: active ? theme.primary + '22' : '#222', border: `1px solid ${active ? theme.primary : '#2a2a2a'}`,
                  borderRadius: '8px', padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type='checkbox' checked={active} style={{ accentColor: theme.primary }}
                    onChange={e => {
                      const leagues = e.target.checked ? [...notifyConfig.leagues, l.id] : notifyConfig.leagues.filter(x => x !== l.id);
                      setNotifyConfig({ ...notifyConfig, leagues });
                    }} />
                  {l.label}
                </label>
              );
            })}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input type='checkbox' checked={!!notifyConfig.onlyFavorites} style={{ accentColor: theme.primary }}
            onChange={e => setNotifyConfig({ ...notifyConfig, onlyFavorites: e.target.checked })} />
          <span>
            {t('settings.notifyFavoritesOnly')}&nbsp;&nbsp;
            <span style={{ color: '#555' }}>({favorites.length} ★)</span>
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.6rem' }}>
          <input type='checkbox' checked={!!notifyConfig.weekly} style={{ accentColor: theme.primary }}
            onChange={e => setNotifyConfig({ ...notifyConfig, weekly: e.target.checked })} />
          <span>
            {t('settings.notifyWeekly')}<br />
            <span style={{ color: '#555', fontSize: '0.75rem' }}>{t('settings.notifyWeeklyHint')}</span>
          </span>
        </label>
      </div>

      {/* Land für TV-Übertragung */}
      <div style={block}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>{t('settings.tvCountry')}</h3>
        <span style={lbl}>{t('settings.tvCountryHint')}</span>
        <select value={country} onChange={e => setCountry(e.target.value)}
          style={{ background: '#111', color: '#fff', border: `1px solid ${theme.primary}44`, borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.95rem', cursor: 'pointer', width: '100%' }}>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <div style={block}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>{t('settings.theme')}</h3>
        <span style={lbl}>{t('settings.themeHint')} <strong style={{ color: theme.primary }}>{theme.name}</strong></span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '0.5rem' }}>
          {THEMES.map(t => (
            <button key={t.name} onClick={() => setTheme(t)} style={{
              background: theme.name === t.name ? t.primary + '22' : '#222',
              color: theme.name === t.name ? '#fff' : '#aaa',
              border: `2px solid ${theme.name === t.name ? t.primary : '#2a2a2a'}`,
              borderRadius: '8px', padding: '0.5rem 0.6rem', cursor: 'pointer',
              fontWeight: theme.name === t.name ? 'bold' : 'normal',
              fontSize: '0.82rem', textAlign: 'left', transition: 'all 0.15s'
            }}><span style={{ marginRight: '6px' }}>{t.emoji}</span>{t.name}</button>
          ))}
        </div>
      </div>

      {/* Darstellung */}
      <div style={{ ...block, borderLeft: `4px solid ${theme.primary}` }}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>{t('settings.display')}</h3>
        <span style={lbl}>{t('settings.displayHint')}</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'light', label: t('settings.light'), color: '#f8fafc' },
            { id: 'dark',  label: t('settings.dark'), color: '#0f0f0f' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              background: mode === m.id ? theme.primary + '22' : '#222',
              color: mode === m.id ? '#fff' : '#aaa',
              border: `2px solid ${mode === m.id ? theme.primary : '#2a2a2a'}`,
              borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer',
              fontWeight: mode === m.id ? 'bold' : 'normal', fontSize: '0.85rem',
            }}>{m.label}</button>
          ))}
          <button onClick={() => setMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')} style={{
            background: '#222', color: '#aaa',
            border: '2px solid #2a2a2a', borderRadius: '8px', padding: '0.5rem 0.9rem',
            cursor: 'pointer', fontSize: '0.85rem',
          }}>{t('settings.systemPref')}</button>
        </div>
        <p style={{ color: '#555', fontSize: '0.75rem', margin: '0.6rem 0 0 0' }}>
          Gespeichert in <code style={{ color: '#888' }}>sn_mode</code>. Nutze im Hell-Modus ☀️ in der Navigation für einen schnellen Wechsel.
        </p>
      </div>

      {/* Schriftgröße */}
      <div style={{ ...block, borderLeft: `4px solid ${theme.primary}` }}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>🔤 Schriftgröße</h3>
        <span style={lbl}>Skaliert die Textgröße der ganzen App (10px-System nach <code style={{ color: '#888' }}>rem</code>). Auch schnell über „Aa“ in der Navigation.</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'small',  label: 'A Klein'   },
            { id: 'normal', label: 'A Normal'  },
            { id: 'large',  label: 'A Groß'    },
          ].map(f => (
            <button key={f.id} onClick={() => setFontSize(f.id)} style={{
              background: fontSize === f.id ? theme.primary + '22' : '#222',
              color: fontSize === f.id ? '#fff' : '#aaa',
              border: `2px solid ${fontSize === f.id ? theme.primary : '#2a2a2a'}`,
              borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer',
              fontWeight: fontSize === f.id ? 'bold' : 'normal', fontSize: '0.85rem',
              fontStyle: 'italic',
            }}>{f.label}</button>
          ))}
        </div>
        <p style={{ color: '#555', fontSize: '0.75rem', margin: '0.6rem 0 0 0' }}>
          Gespeichert in <code style={{ color: '#888' }}>sn_font_size</code>. Klein = 14px, Normal = 16px, Groß = 18px Basis.
        </p>
      </div>

      {/* Barrierefreiheit (Issue #24) */}
      <div style={{ ...block, borderLeft: `4px solid ${theme.primary}` }}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>♿ Barrierefreiheit</h3>
        <span style={lbl}>Fokus-Modus: reizarme Darstellung ohne Animationen/Flashs – für konzentrierteres Arbeiten (ADHS & kognitiv).</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input type='checkbox' checked={!!focusMode} style={{ accentColor: theme.primary, width: '18px', height: '18px' }}
            onChange={e => setFocusMode(e.target.checked)} />
          <span><strong style={{ color: theme.primary }}>Fokus-Modus</strong> &nbsp;<span style={{ color: '#555' }}>(Animationen aus, reduzierte Unruhe)</span></span>
        </label>
      </div>

      {/* API-Keys */}
      <div style={block}>
        <h3 style={{ margin: '0 0 0.3rem 0' }}>🔑 API-Keys</h3>
        <p style={{ color: '#555', fontSize: '0.8rem', margin: '0 0 1.2rem 0' }}>
          Alle Keys werden nur lokal in deinem Browser gespeichert (localStorage) – nie auf dem Server.
        </p>
        {API_KEY_DEFS.map(api => (
          <div key={api.id} style={{ marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
              <div>
                <span style={{ fontWeight: 'bold', color: '#ddd' }}>{api.label}</span>
                {api.free && <span style={{ marginLeft: '0.5rem', background: '#14532d', color: '#4ade80', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px' }}>FREE</span>}
              </div>
              <a href={api.url} target='_blank' rel='noreferrer' style={{ fontSize: '0.72rem', color: theme.primary, textDecoration: 'none' }}>🔗 {api.urlLabel}</a>
            </div>
            <p style={{ color: '#555', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>{api.description}</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type='password'
                value={draftKeys[api.id]}
                onChange={e => setDraftKeys(prev => ({ ...prev, [api.id]: e.target.value }))}
                placeholder={api.placeholder}
                style={{ flex: 1, background: '#111', color: '#fff', border: `1px solid ${draftKeys[api.id] ? '#4ade8044' : '#333'}`, borderRadius: '6px', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
              />
              <button onClick={() => saveKey(api.id)} style={{
                background: savedMsg[api.id] ? '#14532d' : theme.primary,
                color: '#fff', border: 'none', borderRadius: '6px',
                padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                minWidth: '90px', transition: 'background 0.3s'
              }}>{savedMsg[api.id] ? '✅ Gespeichert' : 'Speichern'}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Cleanup */}
      <div style={block}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🗑️ Datenbankbereinigung</h3>
        <span style={lbl}>Gespeicherte Statistiken löschen um Speicherplatz freizugeben</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={cleanupDays} onChange={e => setCleanupDays(Number(e.target.value))}
            style={{ background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '6px', padding: '0.5rem 0.8rem', fontSize: '0.9rem', flex: 1 }}>
            {CLEANUP_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
          <button onClick={handleCleanup} style={{ background: '#991b1b', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}>Löschen</button>
        </div>
        {cleanupMsg && <p style={{ color: cleanupMsg.startsWith('✅') ? '#4ade80' : '#f87171', marginTop: '0.5rem', fontSize: '0.85rem' }}>{cleanupMsg}</p>}
      </div>

      {/* Datenquellen */}
      <div style={{ ...block, background: '#111', border: '1px solid #1a1a1a' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>ℹ️ Datenquellen</h3>
        <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: '1.9' }}>
          <div>⚽ <strong style={{ color: '#888' }}>OpenLigaDB</strong> – Bundesliga (kein Key nötig)</div>
          <div>🏆 <strong style={{ color: '#888' }}>TheSportsDB</strong> – Vereinsinfos & Logos</div>
          <div>📡 <strong style={{ color: '#888' }}>API-Football</strong> – Live-Stats, xG, TV, Schiedsrichter</div>
          <div>🌍 <strong style={{ color: '#888' }}>Football-Data.org</strong> – Internationale Ligen</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '1.5rem 0 0.5rem 0', borderTop: '1px solid #1a1a1a', marginTop: '0.5rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: theme.primary, marginBottom: '0.3rem' }}>📊 StatNerds</div>
        <div style={{ fontSize: '0.78rem', color: '#444', marginBottom: '0.5rem' }}>Version {APP_VERSION}</div>
        <a href={GITHUB_URL} target='_blank' rel='noreferrer'
          style={{ fontSize: '0.78rem', color: '#555', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z'/>
          </svg>
          GitHub – freddykrueger88/StatNerds
        </a>
        <div style={{ fontSize: '0.68rem', color: '#2a2a2a', marginTop: '0.5rem' }}>Made with ❤️ & ⚽</div>
      </div>
    </div>
  );
}
