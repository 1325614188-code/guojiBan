import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入语言包
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import vi from './locales/vi.json';
import ja from './locales/ja.json';
import th from './locales/th.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import ko from './locales/ko.json';

const resources = {
  'en': { translation: en },
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  'vi': { translation: vi },
  'ja': { translation: ja },
  'th': { translation: th },
  'fr': { translation: fr },
  'es': { translation: es },
  'de': { translation: de },
  'ko': { translation: ko }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['querystring', 'localStorage', 'cookie', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
