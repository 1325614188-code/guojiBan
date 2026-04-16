
import React from 'react';
import { AppSection } from '../types';
import InstallPWA from '../components/InstallPWA';
import { getApiUrl } from '../lib/api-config';
import { useTranslation } from 'react-i18next';
import ComplianceInfo from '../components/ComplianceInfo';


interface HomeViewProps {
  onNavigate: (section: AppSection) => void;
  onShowLogin: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onShowLogin }) => {
  const [announcement, setAnnouncement] = React.useState('✨ 发现你的独属魅力 ✨');
  const [showDownloadDialog, setShowDownloadDialog] = React.useState(false);
  const [downloadEnabled, setDownloadEnabled] = React.useState(true);
  const [pwaEnabled, setPwaEnabled] = React.useState(true);
  const [rewardsEnabled, setRewardsEnabled] = React.useState(true);
  const { t } = useTranslation();

  React.useEffect(() => {
    fetch(getApiUrl('/api/auth_v2'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getPublicConfig' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.config?.announcement) {
          setAnnouncement(data.config.announcement);
        }
        if (data.config?.home_download_app_enabled === 'false') {
          setDownloadEnabled(false);
        }
        if (data.config?.home_add_to_desktop_enabled === 'false') {
          setPwaEnabled(false);
        }
        if (data.config?.home_rewards_enabled === 'false') {
          setRewardsEnabled(false);
        }
      })
      .catch(err => console.error('[HomeView] Failed to fetch announcement', err));
  }, []);

  const categories = [
    {
      title: t('categories.aesthetic'),
      bg: 'bg-rose-50/40',
      border: 'border-rose-200',
      accent: 'text-rose-600',
      items: [
        { id: AppSection.ADVANCED_TRY_ON, title: t('sections.advanced_try_on'), icon: '✨', color: 'bg-indigo-100/80', border: 'border-indigo-300', textColor: 'text-indigo-900', isNew: true },
        { id: AppSection.TRY_ON_ACCESSORIES, title: t('sections.try_on_accessories'), icon: '💎', color: 'bg-purple-100/80', border: 'border-purple-200' },
        { id: AppSection.HAIRSTYLE, title: t('sections.hairstyle'), icon: '💇‍♀️', color: 'bg-rose-100/80', border: 'border-rose-200' },
        { id: AppSection.MAKEUP, title: t('sections.makeup'), icon: '💄', color: 'bg-fuchsia-100/80', border: 'border-fuchsia-200' },
        { id: AppSection.BEAUTY_SCORE, title: t('sections.beauty_score'), icon: '✨', color: 'bg-orange-100/80', border: 'border-orange-200' },
        { id: AppSection.JADE_APPRAISAL, title: t('sections.jade_appraisal'), icon: '📿', color: 'bg-emerald-100/80', border: 'border-emerald-200' },
      ]
    },
    {
      title: t('categories.health'),
      bg: 'bg-emerald-50/40',
      border: 'border-emerald-200',
      accent: 'text-emerald-600',
      items: [
        { id: AppSection.AI_EYE_DIAGNOSIS, title: t('sections.ai_eye_diagnosis'), icon: '👁️', color: 'bg-indigo-50/80', border: 'border-indigo-100', isNew: true },
        { id: AppSection.TONGUE_DIAGNOSIS, title: t('sections.tongue_diagnosis'), icon: '👅', color: 'bg-green-100/80', border: 'border-green-200' },
        { id: AppSection.FACE_COLOR, title: t('sections.face_color'), icon: '💆‍♀️', color: 'bg-blue-100/80', border: 'border-blue-200' },
        { id: AppSection.DEPRESSION_TEST, title: t('sections.depression_test'), icon: '💙', color: 'bg-sky-100/80', border: 'border-sky-200' },
      ]
    },
    {
      title: t('categories.metaphysics'),
      bg: 'bg-amber-50/40',
      border: 'border-amber-200',
      accent: 'text-amber-700',
      items: [
        { id: AppSection.COUPLE_FACE, title: t('sections.couple_face'), icon: '👩‍❤️‍👨', color: 'bg-red-100/80', border: 'border-red-200' },
        { id: AppSection.FACE_READING, title: t('sections.face_reading'), icon: '🧿', color: 'bg-indigo-100/80', border: 'border-indigo-200' },
        { id: AppSection.FENG_SHUI, title: t('sections.feng_shui'), icon: '🪑', color: 'bg-yellow-100/80', border: 'border-yellow-300' },
        { id: AppSection.LICENSE_PLATE, title: t('sections.license_plate'), icon: '🚗', color: 'bg-cyan-100/80', border: 'border-cyan-200' },
        { id: AppSection.CALENDAR, title: t('sections.calendar'), icon: '📅', color: 'bg-[#C69C6D]/80', border: 'border-[#A67C4D]', textColor: 'text-white' },
        { id: AppSection.MARRIAGE_ANALYSIS, title: t('sections.marriage_analysis'), icon: '💘', color: 'bg-rose-50/80', border: 'border-rose-100' },
        { id: AppSection.WEALTH_ANALYSIS, title: t('sections.wealth_analysis'), icon: '💰', color: 'bg-amber-50/80', border: 'border-amber-100' },
        { id: AppSection.ZI_WEI_DOU_SHU, title: t('sections.zi_wei_dou_shu'), icon: '🌌', color: 'bg-indigo-50/80', border: 'border-indigo-100', isNew: true },
      ]
    },
    {
      title: t('categories.psychology'),
      bg: 'bg-violet-50/40',
      border: 'border-violet-200',
      accent: 'text-violet-600',
      items: [
        { id: AppSection.MBTI_TEST, title: t('sections.mbti_test'), subTitle: t('sections.mbti_subtitle'), icon: '🧠', color: 'bg-violet-100/80', border: 'border-violet-200' },
        { id: AppSection.EQ_TEST, title: t('sections.eq_test'), icon: '🎭', color: 'bg-pink-100/80', border: 'border-pink-200', isNew: true },
        { id: AppSection.IQ_TEST, title: t('sections.iq_test'), icon: '🧬', color: 'bg-sky-100/80', border: 'border-sky-200', isNew: true },
        { id: AppSection.BIG_FIVE, title: t('sections.big_five'), icon: '🌊', color: 'bg-violet-100/80', border: 'border-violet-200', isNew: true },
      ]
    }
  ];

  // 检测是否在原生 App 环境（Capacitor）
  const isApp = (window as any).Capacitor?.isNative;

  const handleDownloadClick = () => {
    setShowDownloadDialog(true);
  };

  const confirmDownload = () => {
    setShowDownloadDialog(false);
    onNavigate(AppSection.APP_DOWNLOAD);
  };

  const goToLogin = () => {
    setShowDownloadDialog(false);
    onShowLogin();
  };

  const getAnnouncementText = () => {
    if (!announcement || announcement === '✨ 发现你的独属魅力 ✨') return t('common.announcement_default');
    if (announcement === 'APP已经更新，请及时下载安装。') return t('common.announcement_update');
    return announcement;
  };

  return (
    <div className="p-6 pb-20">
      <header className="mb-8 text-center">
        <h1 className="text-4xl art-title mb-2">✨ {t('common.app_name')} ✨</h1>
        <div className="bg-white/50 backdrop-blur-sm border border-pink-100 rounded-full py-1 px-4 overflow-hidden relative h-8 flex items-center">
          <div className="whitespace-nowrap inline-block animate-marquee hover:pause text-gray-500 text-sm font-medium">
            <span className="inline-block px-4">{getAnnouncementText()}</span>
            <span className="inline-block px-4">{getAnnouncementText()}</span>
          </div>
        </div>
      </header>

      <div className="mb-8 flex gap-3 items-start justify-stretch">
        {!isApp && downloadEnabled && (
          <button
            onClick={handleDownloadClick}
            className="flex-1 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-transform active:scale-95 text-[11px] font-bold no-underline"
          >
            <span className="text-xl">📦</span>
            {t('home.download_app')}
          </button>
        )}
        {pwaEnabled && (
          <div className="flex-1">
            <InstallPWA />
          </div>
        )}
      </div>

      <div className="space-y-10">
        {categories.map((cat, catIdx) => (
          <div 
            key={catIdx} 
            className={`${cat.bg} ${cat.border} border-2 border-dashed rounded-[32px] p-6 relative pt-8`}
          >
            {/* Category Title Badge */}
            <div className={`absolute -top-4 left-6 px-4 py-1.5 rounded-full bg-white border ${cat.border} shadow-sm z-10`}>
              <span className={`text-xs font-black tracking-widest ${cat.accent}`}>{cat.title}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {cat.items.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => onNavigate(sec.id)}
                  className={`${sec.color} ${sec.border} border-b-4 border-r-2 ${sec.textColor || 'text-gray-800'} rounded-2xl p-4 flex flex-row items-center justify-start gap-3 shadow-sm hover:shadow-md transition-all transform active:scale-95 h-16 relative overflow-hidden group`}
                >
                  {sec.isNew && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg z-10">NEW</div>
                  )}
                  <span className="text-2xl flex-shrink-0 relative z-10 group-hover:scale-110 transition-transform">{sec.icon}</span>
                  <div className="flex flex-col items-start overflow-hidden relative z-10">
                    <span className="font-black text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {sec.title}
                    </span>
                    { (sec as any).subTitle && (
                      <span className="text-[10px] opacity-60 font-bold -mt-0.5">
                        {(sec as any).subTitle}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>


      {/* 下载提示对话框 */}
      {showDownloadDialog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl scale-in-center animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🎁</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('home.download_dialog.title')}</h3>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-8 whitespace-pre-line">
                {t('home.download_dialog.content')}
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={confirmDownload}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-transform"
                >
                  {t('home.download_dialog.go_download')}
                </button>
                <button
                  onClick={goToLogin}
                  className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold active:scale-95 transition-transform"
                >
                  {t('home.download_dialog.go_login')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ComplianceInfo rewardsEnabled={rewardsEnabled} />
    </div>
  );
};

export default HomeView;
