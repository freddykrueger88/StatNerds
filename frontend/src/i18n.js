import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de';
import en from './locales/en';
import es from './locales/es';

// Sprache aus localStorage, sonst Browser-Sprache, sonst Deutsch
function detectLanguage() {
  try { const saved = localStorage.getItem('sn_lang'); if (saved) return saved; } catch {}
  if (typeof navigator !== 'undefined' && navigator.language) {
    const l = navigator.language.toLowerCase();
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en';
  }
  return 'de';
}

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en }, es: { translation: es } },
  lng: detectLanguage(),
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Sprachwechsel in localStorage persistieren
i18n.on('languageChanged', lng => {
  try { localStorage.setItem('sn_lang', lng); } catch {}
});

export default i18n;
