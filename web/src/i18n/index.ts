import { createI18n } from 'vue-i18n';
import de from './messages/de.json';
import en from './messages/en.json';

export const supportedUiLocales = ['en', 'de'] as const;
export type SupportedUiLocale = (typeof supportedUiLocales)[number];

function normalizeLocale(input?: string | null): SupportedUiLocale {
  const baseLocale = input?.toLowerCase().split('-')[0];
  return baseLocale === 'de' ? 'de' : 'en';
}

const defaultLocale = normalizeLocale(typeof navigator === 'undefined' ? undefined : navigator.language);

const i18n = createI18n({
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    de,
  },
});

export { normalizeLocale };
export default i18n;
