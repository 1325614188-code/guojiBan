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

// 检查是否手动设置过语言
const isManuallySet = typeof window !== 'undefined' && localStorage.getItem('lang_manually_set') === 'true';
const initialLang = isManuallySet 
  ? (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'vi' : 'vi')
  : 'vi';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      // 仅从 querystring 或已手动设置的 localStorage 中检测，避免 navigator 自动检测浏览器语言
      order: isManuallySet ? ['querystring', 'localStorage'] : ['querystring'],
      caches: ['localStorage'],
    }
  });

export default i18n;
