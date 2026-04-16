/**
 * 地理位置与语言自动切换服务
 */

import i18n from '../lib/i18n';

const GEO_API = 'https://ipapi.co/json/';

const countryToLang: Record<string, string> = {
  'CN': 'zh-CN',
  'HK': 'zh-TW',
  'TW': 'zh-TW',
  'MO': 'zh-TW',
  'VN': 'vi',
  'JP': 'ja',
  'TH': 'th',
  'FR': 'fr',
  'ES': 'es',
  'DE': 'de',
  'KR': 'ko',
  'US': 'en',
  'GB': 'en',
  'CA': 'en',
  'AU': 'en',
  'SG': 'en'
};

export async function detectAndSetLanguage() {
  try {
    // 1. 检查是否已经手动选择了语言 (Manually set by user)
    const manuallySet = localStorage.getItem('lang_manually_set');
    if (manuallySet === 'true') {
      console.log(`[Geo] Language manually set, skipping IP detection.`);
      return;
    }

    // 2. 调用 IP 定位接口
    console.log('[Geo] Detecting country by IP...');
    const response = await fetch(GEO_API);
    if (!response.ok) throw new Error('IP API Error');
    
    const data = await response.json();
    const countryCode = data.country_code; // 例如 "US", "HK", "CN"

    let targetLang = 'en'; // 默认设为英文 (Default to English)

    if (countryCode && countryToLang[countryCode]) {
      targetLang = countryToLang[countryCode];
    }

    console.log(`[Geo] Country detected: ${countryCode || 'unknown'}, switching to: ${targetLang}`);
    i18n.changeLanguage(targetLang);
  } catch (error) {
    console.error('[Geo] Detection failed, falling back to English:', error);
    // 即使识别失败，国际化版本也应默认英文
    i18n.changeLanguage('en');
  }
}
