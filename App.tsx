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

// 版本标识，用于确认用户是否加载了最新代码
const APP_VERSION = '20260214-FINAL-V1';

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // 从 localStorage 恢复用户状态，并处理支付回调
  useEffect(() => {
    console.log(`[App] Version: ${APP_VERSION} initialized.`);

    // 1. 恢复用户状态
    const savedUser = localStorage.getItem('user');
    let parsedUser: any = null;

    if (savedUser) {
      try {
        parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('[App] Local user loaded:', parsedUser.username, parsedUser.id);

        // 强力获取最新数据
        const syncUser = async () => {
          try {
            const res = await fetch(`/api/auth?t=${Date.now()}`, {
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

    // 2. 检测 Stripe 支付成功回调
    const urlParams = new URLSearchParams(window.location.search);
    const paymentResult = urlParams.get('payment');
    const orderIdFromUrl = urlParams.get('order_id');

    if (paymentResult === 'success' && orderIdFromUrl) {
      console.log('[Payment] Callback detected:', orderIdFromUrl);
      window.history.replaceState({}, '', window.location.pathname);

      fetch(`/api/stripe?t=${Date.now()}`, {
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
            // 立即再次同步
            fetch(`/api/auth?t=${Date.now()}`, {
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

  // 初始化设备ID
  useEffect(() => {
    const initId = async () => {
      const storedId = localStorage.getItem('device_id');
      if (!storedId || storedId.startsWith('dev_')) {
        const fingerId = await getStableDeviceId();
        localStorage.setItem('device_id', fingerId);
      }
    };
    initId();
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
      const res = await fetch(`/api/auth?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'useCredit', userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needCredits) {
          alert('Insufficient credits. Please recharge or use a redeem code.');
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
      const res = await fetch(`/api/auth?t=${Date.now()}`, {
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
        return <TryOnView type="clothes" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.TRY_ON_ACCESSORIES:
        return <TryOnView type="accessories" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.HAIRSTYLE:
        return <HairstyleView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.MAKEUP:
        return <MakeupView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.BEAUTY_SCORE:
        return <AnalysisView title="颜值打分" type="颜值打分" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.COUPLE_FACE:
        return <CoupleFaceView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.TONGUE_DIAGNOSIS:
        return <AnalysisView title="趣味舌诊" type="舌诊" onBack={() => setCurrentSection(AppSection.HOME)} helpText="Please upload a clear tongue photo." onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.FACE_COLOR:
        return <AnalysisView title="面色分析" type="中医面色" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.FACE_READING:
        return <AnalysisView title="传统面相" type="传统相术" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.FENG_SHUI:
        return <FengShuiView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.LICENSE_PLATE:
        return <LicensePlateView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.CALENDAR:
        return <CalendarView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.MBTI_TEST:
        return <MBTITestView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      case AppSection.DEPRESSION_TEST:
        return <DepressionTestView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} />;
      default:
        return <HomeView onNavigate={setCurrentSection} />;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden bg-pink-50 flex flex-col shadow-2xl">
      <div className="flex-1 overflow-y-auto pb-20">
        {renderSection()}
      </div>

      {/* Version Tag */}
      <div className="fixed top-2 right-2 text-[8px] text-gray-300 pointer-events-none z-50">
        v{APP_VERSION}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-white/80 backdrop-blur-md border-t flex justify-around items-center px-4 z-50">
        <button
          onClick={() => setCurrentSection(AppSection.HOME)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentSection === AppSection.HOME ? 'text-pink-500' : 'text-gray-500'}`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={() => user ? setShowMember(true) : setShowLogin(true)}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-pink-500 transition-colors"
        >
          <span className="text-xl">{user ? '👤' : '🔐'}</span>
          <span className="text-xs">{user ? 'Me' : 'Login'}</span>
        </button>
        {user?.is_admin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-500 transition-colors"
          >
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Admin</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
