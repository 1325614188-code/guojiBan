
import React from 'react';
import { AppSection } from '../types';
import InstallPWA from '../components/InstallPWA';
import LegalFooter from '../components/LegalFooter';
import { useTranslation, Language } from '../lib/i18n';

interface HomeViewProps {
  onNavigate: (section: AppSection) => void;
}
const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { t, lang, changeLanguage } = useTranslation();

  const sections = [
    { id: AppSection.TRY_ON_CLOTHES, title: t('virtual_try_on') || 'Virtual Try-on', icon: '👗', color: 'bg-pink-100', border: 'border-pink-300' },
    { id: AppSection.TRY_ON_ACCESSORIES, title: t('accessories') || 'Accessories', icon: '💎', color: 'bg-purple-100', border: 'border-purple-300' },
    { id: AppSection.HAIRSTYLE, title: t('hairstyle') || 'Hairstyle', icon: '💇‍♀️', color: 'bg-rose-100', border: 'border-rose-300' },
    { id: AppSection.MAKEUP, title: t('ai_makeup') || 'AI Makeup', icon: '💄', color: 'bg-fuchsia-100', border: 'border-fuchsia-300' },
    { id: AppSection.BEAUTY_SCORE, title: t('beauty_score') || 'Beauty Score', icon: '✨', color: 'bg-orange-100', border: 'border-orange-300' },
    { id: AppSection.COUPLE_FACE, title: t('couple_face') || 'Couple Face', icon: '👩‍❤️‍👨', color: 'bg-red-100', border: 'border-red-300' },
    { id: AppSection.TONGUE_DIAGNOSIS, title: t('tongue_check') || 'Tongue Check', icon: '👅', color: 'bg-green-100', border: 'border-green-300' },
    { id: AppSection.FACE_COLOR, title: t('face_glow') || 'Face Glow', icon: '💆‍♀️', color: 'bg-blue-100', border: 'border-blue-300' },
    { id: AppSection.FACE_READING, title: t('face_reading') || 'Face Reading', icon: '🧿', color: 'bg-indigo-100', border: 'border-indigo-300' },
    { id: AppSection.FENG_SHUI, title: t('feng_shui') || 'Feng Shui', icon: '🪑', color: 'bg-yellow-100', border: 'border-yellow-400' },
    { id: AppSection.LICENSE_PLATE, title: t('car_plate') || 'Car Plate', icon: '🚗', color: 'bg-cyan-100', border: 'border-cyan-300' },
    { id: AppSection.CALENDAR, title: t('daily_guide') || 'Daily Guide', icon: '📅', color: 'bg-[#C69C6D]', border: 'border-[#A67C4D]', textColor: 'text-white' },
    { id: AppSection.MBTI_TEST, title: t('talent_test') || 'Talent Test', icon: '🧠', color: 'bg-violet-100', border: 'border-violet-300' },
    { id: AppSection.DEPRESSION_TEST, title: t('depression') || 'Depression', icon: '💙', color: 'bg-sky-100', border: 'border-sky-300' },
    { id: AppSection.LOVE_FORTUNE, title: t('love_fortune'), icon: '💑', color: 'bg-pink-200', border: 'border-pink-400' },
    { id: AppSection.WEALTH_FORTUNE, title: t('wealth_fortune'), icon: '💰', color: 'bg-amber-100', border: 'border-amber-300' },
  ];

  return (
    <div className="p-6">
      <header className="mb-8 text-center relative">
        <h1 className="text-4xl art-title mb-2">✨ Beauty Lab ✨</h1>
        <p className="text-gray-500 text-sm">✨ {t('discover_unique_charm') || 'Discover Your Unique Charm'} ✨</p>
      </header>

      {/* Download & Install Section */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            // Point to the APK file in public directory
            window.location.href = '/app-release.apk';
          }}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all text-sm"
        >
          <span>🤖</span> {t('download_apk')}
        </button>
        <InstallPWA />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => onNavigate(sec.id)}
            className={`${sec.color} ${sec.border} border ${sec.textColor || 'text-gray-800'} rounded-2xl p-4 flex flex-row items-center justify-start gap-3 shadow-[0_4px_15px_rgba(255,107,157,0.3)] hover:shadow-[0_6px_20px_rgba(255,107,157,0.4)] transition-all transform active:scale-95 h-16`}
          >
            <span className="text-2xl flex-shrink-0">{sec.icon}</span>
            <span className="font-bold text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
              {sec.title}
            </span>
          </button>
        ))}
      </div>

      {/* Pricing & Rules Section */}
      <div className="mt-12 mb-8 bg-white/50 backdrop-blur-sm rounded-3xl p-6 border border-pink-100 shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-center text-pink-600">💰 {t('pricing_rules') || 'Pricing & Rules'}</h2>

        <div className="space-y-6">
          {/* Recharge Rules */}
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
              {t('recharge_credits') || 'Recharge Credits'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center">
                <div className="text-lg font-bold text-pink-500">12 Credits</div>
                <div className="text-xs text-gray-400">$5</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center">
                <div className="text-lg font-bold text-purple-500">30 Credits</div>
                <div className="text-xs text-gray-400">$10</div>
              </div>
            </div>
          </section>

          {/* Gift & Referral Rules */}
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
              {t('free_gifts_referrals') || 'Free Gifts & Referrals'}
            </h3>
            <div className="space-y-2 text-xs text-gray-600 bg-white/80 p-4 rounded-2xl border border-pink-50">
              <p className="flex items-start gap-2">
                <span className="text-pink-500">🎁</span>
                <span><b>{t('daily_gift') || 'Daily Gift'}:</b> Get 5 free credits monthly with a redeem code.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-pink-500">📤</span>
                <span><b>{t('share_earn') || 'Share & Earn'}:</b> Earn 1 credit per friend registration.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-pink-500">⭐</span>
                <span><b>{t('referral_reward_system')}:</b> 1 pt/referral. 50 pts → $4, 100 pts → $10.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-pink-500">💰</span>
                <span><b>{t('referral_commission')}:</b> 40% commission on any recharge from your referrals!</span>
              </p>
            </div>
          </section>

          {/* Contact */}
          <div className="pt-4 border-t border-dashed border-gray-200 text-center">
            <p className="text-[10px] text-gray-400">
              {t('need_help') || 'Need help? Contact us at:'} <span className="text-pink-400 font-medium">408457641@qq.com</span>
            </p>
          </div>
        </div>
      </div>

      <LegalFooter />
    </div>
  );
};

export default HomeView;
