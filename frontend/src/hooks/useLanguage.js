import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Sprachwahl (Issue #16): nutzt react-i18next, Sprache wird über die
// i18n-instanz in localStorage ('sn_lang') persistiert.
export function useLanguage() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'de';

  const setLanguage = useCallback(lng => {
    i18n.changeLanguage(lng);
  }, [i18n]);

  return { language, setLanguage, t };
}
