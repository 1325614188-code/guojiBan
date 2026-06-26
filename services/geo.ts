/**
 * 地理位置与语言自动切换服务
 */

import i18n from '../lib/i18n';



export async function detectAndSetLanguage() {
  try {
    // 1. 检查是否已经手动选择了语言 (Manually set by user)
    const manuallySet = localStorage.getItem('lang_manually_set');
    if (manuallySet === 'true') {
      console.log(`[Geo] Language manually set, skipping IP detection.`);
      return;
    }

    // 2. 由于默认语言为越南语，我们不再根据 IP 自动切换到其它国家的语言（以防国内或其它地区访问时自动切走）
    console.log(`[Geo] Default language forced to: vi`);
    i18n.changeLanguage('vi');
  } catch (error) {
    console.error('[Geo] Detection failed, falling back to Vietnamese:', error);
    i18n.changeLanguage('vi');
  }
}
