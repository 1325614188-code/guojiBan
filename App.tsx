import React, { useState, useEffect } from 'react';
import { AppSection } from './types';
import { getStableDeviceId } from './lib/fingerprint';
import HomeView from './views/HomeView';
import TryOnView from './views/TryOnView';
import HairstyleView from './views/HairstyleView';
import AnalysisView from './views/AnalysisView';
import CalendarView from './views/CalendarView';
import CoupleFaceView from './views/CoupleFaceView';
import FengShuiView from './views/FengShuiView';
import LicensePlateView from './views/LicensePlateView';
import LoginView from './views/LoginView';
import MemberView from './views/MemberView';
import AdminView from './views/AdminView';
import MakeupView from './views/MakeupView';
import MBTITestView from './views/MBTITestView';
import DepressionTestView from './views/DepressionTestView';
import LoveFortuneView from './views/LoveFortuneView';
import WealthFortuneView from './views/WealthFortuneView';
import { useTranslation, Language } from './lib/i18n';
import { API_BASE, isNative } from './lib/config';

// 版本标识，用于确认用户是否加载了最新代码
const APP_VERSION = '20260302-V2';

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { t, lang, changeLanguage } = useTranslation();

  // 从 localStorage 恢复用户状态，并处理支付回调
  useEffect(() => {
    console.log(`[App] Version: ${APP_VERSION} initialized.`);

    // 强制清理旧的 Service Worker，防止 API 被缓存拦截
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
          console.warn('[App] SW Unregistered');
        }
      });
    }

    // 1. 恢复用户状态
    const savedUser = localStorage.getItem('user');
    let parsedUser: any = null;

    if (savedUser) {
      try {
        parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('[App] Local user loaded:', parsedUser.username, parsedUser.id);

        // Force fetch latest data
        const syncUser = async () => {
          try {
            const res = await fetch(`${API_BASE}/api/auth_v2?t=${Date.now()}&r=${Math.random()}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
              body: JSON.stringify({ action: 'getUser', userId: parsedUser.id })
            });
            const data = await res.json();
            if (data.user) {
              console.log('[App] API User Sync Output:', data.user.credits);
              const updatedUser = {
                ...parsedUser,
                credits: data.user.credits,
                _db: data._db,
                _v: data._v
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (e) {
            console.error('[App] Sync Failed:', e);
          }
        };
        syncUser();
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    // 2. Detect Stripe payment success callback
    const urlParams = new URLSearchParams(window.location.search);
    const paymentResult = urlParams.get('payment');
    const orderIdFromUrl = urlParams.get('order_id');

    if (paymentResult === 'success' && orderIdFromUrl) {
      console.log('[Payment] Callback detected:', orderIdFromUrl);
      window.history.replaceState({}, '', window.location.pathname);

      fetch(`${API_BASE}/api/stripe?t=${Date.now()}&r=${Math.random()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmOrder',
          orderId: orderIdFromUrl,
          userId: parsedUser?.id || 'anonymous'
        })
      })
        .then(res => res.json())
        .then(confirmData => {
          console.log('[Payment Confirm Success]', confirmData);
          localStorage.removeItem('pending_order_id');

          const targetUserId = parsedUser?.id || confirmData.userId;
          if (targetUserId) {
            // Sync again immediately
            fetch(`/api/auth_v2?t=${Date.now()}&r=${Math.random()}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
              body: JSON.stringify({ action: 'getUser', userId: targetUserId })
            })
              .then(res => res.json())
              .then(userData => {
                if (userData.user) {
                  const freshUser = {
                    ...(parsedUser || userData.user),
                    credits: userData.user.credits,
                    _db: userData._db,
                    _v: userData._v
                  };
                  setUser(freshUser);
                  localStorage.setItem('user', JSON.stringify(freshUser));
                  console.log('[Payment] Final UI Update Success:', userData.user.credits);

                  if (!parsedUser) {
                    setShowLogin(false);
                    setShowMember(true);
                  }
                }
              });
          }
        })
        .catch(err => {
          console.error('[Payment Confirm Error]', err);
        });
    } else if (paymentResult === 'cancel') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Initialize device ID and language detection
  useEffect(() => {
    const initId = async () => {
      const storedId = localStorage.getItem('device_id');
      if (!storedId || storedId.startsWith('dev_')) {
        const fingerId = await getStableDeviceId();
        localStorage.setItem('device_id', fingerId);
      }
    };
    initId();

    // Auto-detect language if not set
    const storedLang = localStorage.getItem('lang');
    if (!storedLang) {
      const detectLang = async () => {
        try {
          // Attempt to detect via IP or browser
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          const country = data.country_code; // e.g., 'VN', 'KR', 'JP', 'CN'
          let detected: Language = 'en';
          if (country === 'VN') detected = 'vi';
          else if (country === 'KR') detected = 'ko';
          else if (country === 'JP') detected = 'ja';
          else if (country === 'CN') detected = 'zh';

          changeLanguage(detected);
        } catch (e) {
          // Fallback to browser lang
          const browserLang = navigator.language.split('-')[0];
          const supported: Language[] = ['en', 'vi', 'ko', 'ja', 'zh'];
          if (supported.includes(browserLang as any)) {
            changeLanguage(browserLang as Language);
          }
        }
      };
      detectLang();
    }
  }, []);

  const handleLogin = (loggedUser: any) => {
    setUser(loggedUser);
    setShowLogin(false);
    if (loggedUser.is_admin) {
      setShowAdmin(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowMember(false);
    setShowAdmin(false);
  };

  const checkCredits = async (): Promise<boolean> => {
    if (!user) {
      setShowLogin(true);
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth_v2?t=${Date.now()}&r=${Math.random()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'useCredit', userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needCredits) {
          alert(t('insufficient_credits'));
          setShowMember(true);
        }
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(`${API_BASE}/api/auth_v2?t=${Date.now()}&r=${Math.random()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deductCredit', userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.success && typeof data.credits === 'number') {
        const updatedUser = { ...user, credits: data.credits };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // 类型安全的包装器，解决 Lint 报错
  const handleCheckCredits = async (): Promise<boolean> => { return await checkCredits(); };
  const handleDeductCredit = async (): Promise<void> => { await deductCredit(); };

  if (showLogin) {
    return <LoginView onLogin={handleLogin} onBack={() => setShowLogin(false)} />;
  }

  if (showAdmin && user?.is_admin) {
    return <AdminView admin={user} onBack={() => setShowAdmin(false)} />;
  }

  if (showMember && user) {
    const handleUserUpdate = (updatedUser: any) => {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    };
    return <MemberView user={user} onLogout={handleLogout} onBack={() => setShowMember(false)} onUserUpdate={handleUserUpdate} />;
  }

  const renderSection = () => {
    switch (currentSection) {
      case AppSection.HOME:
        return <HomeView onNavigate={setCurrentSection} />;
      case AppSection.TRY_ON_CLOTHES:
        return <TryOnView type="clothes" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.TRY_ON_ACCESSORIES:
        return <TryOnView type="accessories" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.HAIRSTYLE:
        return <HairstyleView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.MAKEUP:
        return <MakeupView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.BEAUTY_SCORE:
        return <AnalysisView title={t('beauty_score_title')} type="Beauty Score" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.COUPLE_FACE:
        return <CoupleFaceView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.TONGUE_DIAGNOSIS:
        return <AnalysisView title={t('tongue_analysis_title')} type="Tongue" onBack={() => setCurrentSection(AppSection.HOME)} helpText={t('tongue_help')} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.FACE_COLOR:
        return <AnalysisView title={t('face_color_title')} type="TCM Face Color" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.FACE_READING:
        return <AnalysisView title={t('face_reading_title')} type="Traditional Physiognomy" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.FENG_SHUI:
        return <FengShuiView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.LICENSE_PLATE:
        return <LicensePlateView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.CALENDAR:
        return <CalendarView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.MBTI_TEST:
        return <MBTITestView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.DEPRESSION_TEST:
        return <DepressionTestView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.LOVE_FORTUNE:
        return <LoveFortuneView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      case AppSection.WEALTH_FORTUNE:
        return <WealthFortuneView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={handleCheckCredits} onDeductCredit={handleDeductCredit} />;
      default:
        return <HomeView onNavigate={setCurrentSection} />;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden bg-pink-50 flex flex-col shadow-2xl">
      <div className="flex-1 overflow-y-auto pb-24">
        {renderSection()}
      </div>

      {/* Global Language Selector */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-1">
        <select
          value={lang}
          onChange={(e) => changeLanguage(e.target.value as Language)}
          className="bg-white/80 backdrop-blur-md border border-pink-200 rounded-full text-xs py-1 px-3 focus:outline-none shadow-sm cursor-pointer hover:bg-white transition-all appearance-none pr-8 relative"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23ec4899\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
        >
          <option value="en">English</option>
          <option value="zh">简体中文</option>
          <option value="vi">Tiếng Việt</option>
          <option value="ko">한국어</option>
          <option value="ja">日本語</option>
        </select>
        <div className="text-[10px] text-gray-300 pointer-events-none">
          v{APP_VERSION}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-white/95 backdrop-blur-md border-t flex justify-around items-center px-4 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => setCurrentSection(AppSection.HOME)}
          className={`flex flex-col items-center justify-center gap-1 h-full px-6 transition-colors ${currentSection === AppSection.HOME ? 'text-pink-500' : 'text-gray-500'}`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-xs">{t('home')}</span>
        </button>
        <button
          onClick={() => user ? setShowMember(true) : setShowLogin(true)}
          className="flex flex-col items-center justify-center gap-1 h-full px-6 text-gray-500 hover:text-pink-500 transition-colors"
        >
          <span className="text-xl">{user ? '👤' : '🔐'}</span>
          <span className="text-xs">{user ? t('me') : t('login')}</span>
        </button>
        {user?.is_admin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="flex flex-col items-center justify-center gap-1 h-full px-6 text-gray-500 hover:text-purple-500 transition-colors"
          >
            <span className="text-xl">⚙️</span>
            <span className="text-xs">{t('admin')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
