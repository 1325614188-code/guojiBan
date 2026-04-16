
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { AppSection, User } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import HomeView from './views/HomeView';
import TryOnView from './views/TryOnView';
import AdvancedTryOnView from './views/AdvancedTryOnView';
import HairstyleView from './views/HairstyleView';
import MakeupView from './views/MakeupView';
import AnalysisView from './views/AnalysisView';
import CoupleFaceView from './views/CoupleFaceView';
import FengShuiView from './views/FengShuiView';
import LicensePlateView from './views/LicensePlateView';
import CalendarView from './views/CalendarView';
import MBTITestView from './views/MBTITestView';
import EQTestView from './views/EQTestView';
import IQTestView from './views/IQTestView';
import BigFiveView from './views/BigFiveView';
import DepressionTestView from './views/DepressionTestView';
import MarriageView from './views/MarriageView';
import WealthView from './views/WealthView';
import ZiWeiView from './views/ZiWeiView';
import JadeAppraisalView from './views/JadeAppraisalView';
import LoginView from './views/LoginView';
import MemberView from './views/MemberView';
import AdminView from './views/AdminView';
import EyeDiagnosisView from './views/EyeDiagnosisView';
import LinktreeView from './views/LinktreeView';
import { getApiUrl } from './lib/api-config';
import { App as CapApp } from '@capacitor/app';
import { getStableDeviceId } from './lib/fingerprint';
import { useTranslation } from 'react-i18next';
import { detectAndSetLanguage } from './services/geo';
import i18n from './lib/i18n';

const App: React.FC = () => {
    const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  // 【问题1修复】user 类型从 any 改为 User | null
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // 【问题2修复】并发锁：防止 checkCredits 通过后在 AI 处理期间被再次调用
  const isProcessingRef = useRef(false);

  // 【问题5修复】用 ref 保存最新的状态值，供返回键回调读取，避免闭包陷阱
  const currentSectionRef = useRef(currentSection);
  const showLoginRef = useRef(showLogin);
  const showMemberRef = useRef(showMember);
  const showAdminRef = useRef(showAdmin);
  const { t } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);

  // 同步 state 到 ref（每次 state 变化时自动更新）
  useEffect(() => { currentSectionRef.current = currentSection; }, [currentSection]);
  useEffect(() => { showLoginRef.current = showLogin; }, [showLogin]);
  useEffect(() => { showMemberRef.current = showMember; }, [showMember]);
  useEffect(() => { showAdminRef.current = showAdmin; }, [showAdmin]);

  // 0. 初始化地理位置语言检测
  useEffect(() => {
    detectAndSetLanguage();
  }, []);

  // 1. 初始化用户状态 (Effect #1)
  useEffect(() => {
    // 捕获推荐人
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) localStorage.setItem('referrer_id', ref);

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        setUser(parsedUser);

        // 增量更新用户信息
        const ts = Date.now();
        fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getUser', userId: parsedUser.id })
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              const upUser: User = { ...parsedUser, ...data.user };
              setUser(upUser);
              localStorage.setItem('user', JSON.stringify(upUser));
            }
          }).catch(e => console.error('[App] User sync failed', e));
      } catch (e) { localStorage.removeItem('user'); }
    }
  }, []);

  // 2. 初始化设备ID (Effect #2)
  useEffect(() => {
    const initId = async () => {
      try {
        const storedId = localStorage.getItem('device_id');
        if (!storedId || storedId.startsWith('dev_')) {
          const fingerId = await getStableDeviceId();
          localStorage.setItem('device_id', fingerId);
        }
      } catch (e) { console.error('[App] Fingerprint failed', e); }
    };
    initId();
  }, []);

  // 3. 路由路径检测: 支持 /linktree 直接访问
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/linktree' || path.endsWith('/linktree')) {
      setCurrentSection(AppSection.LINKTREE);
    }
  }, []);


  // 4. Android 物理返回键监听 (Effect #4)

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    setShowLogin(false);
    if (u.is_admin) setShowAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowMember(false);
    setShowAdmin(false);
    setCurrentSection(AppSection.HOME); // 登出时返回首页
  };

  /**
   * 统一导航处理（带逻辑拦截）
   */
  const handleNavigate = (section: AppSection) => {
    // 豁免区域：首页、App 下载和导航页
    if (section === AppSection.HOME || section === AppSection.APP_DOWNLOAD || section === AppSection.LINKTREE) {
      setCurrentSection(section);
      return;
    }

    // 鉴权拦截：所有测试项目必须登录
    if (!user) {
      setShowLogin(true);
      return;
    }

    setCurrentSection(section);
  };

  const handleUserUpdate = (up: User) => {
    setUser(up);
    localStorage.setItem('user', JSON.stringify(up));
  };

  const checkCredits = async (): Promise<boolean> => {
    if (!user) { setShowLogin(true); return false; }
    if (isProcessingRef.current) {
      console.warn('[App] checkCredits blocked: 上一个请求仍在处理中');
      return false;
    }
    try {
      const res = await fetch(getApiUrl('/api/auth_v2'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'useCredit', userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needCredits) { alert('额度不足'); setShowMember(true); }
        return false;
      }
      isProcessingRef.current = true;
      return true;
    } catch { return false; }
  };

  const deductCredit = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(getApiUrl('/api/auth_v2'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deductCredit', userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleUserUpdate({ ...user, credits: data.credits });
        return true;
      }
      return false;
    } catch { return false; }
    finally {
      isProcessingRef.current = false;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen max-w-md mx-auto relative overflow-hidden bg-pink-50 flex flex-col shadow-2xl pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        {/* 语言切换器 */}
        <div className="absolute top-4 right-4 z-[1001]">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-lg border border-pink-100 active:scale-95 transition-all"
          >
            🌐
          </button>
          
          {showLangMenu && (
            <div className="absolute top-12 right-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-50 p-2 min-w-[120px] animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { code: 'zh-CN', name: '简体中文' },
                { code: 'zh-TW', name: '繁体中文' },
                { code: 'en', name: 'English' },
                { code: 'vi', name: 'Tiếng Việt' },
                { code: 'ja', name: '日本語' },
                { code: 'th', name: 'ไทย' },
                { code: 'fr', name: 'Français' },
                { code: 'es', name: 'Español' },
                { code: 'de', name: 'Deutsch' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    localStorage.setItem('i18nextLng', lang.code);
                    localStorage.setItem('lang_manually_set', 'true');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i18n.language === lang.code ? 'bg-pink-500 text-white' : 'text-gray-600 hover:bg-pink-50'}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <Suspense fallback={<div className="flex items-center justify-center p-20 animate-pulse text-pink-300">{t('common.loading')}</div>}>

            {showLogin && <LoginView onLogin={handleLogin} onBack={() => setShowLogin(false)} />}

            {!showLogin && showAdmin && user?.is_admin && <AdminView admin={user} onBack={() => setShowAdmin(false)} />}

            {!showLogin && !showAdmin && showMember && user && <MemberView user={user} onLogout={handleLogout} onBack={() => setShowMember(false)} onUserUpdate={handleUserUpdate} />}

            {!showLogin && !showAdmin && !showMember && (
              <>
                {currentSection === AppSection.HOME && <HomeView onNavigate={handleNavigate} onShowLogin={() => setShowLogin(true)} />}
                {currentSection === AppSection.ADVANCED_TRY_ON && <AdvancedTryOnView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.TRY_ON_CLOTHES && <TryOnView type="clothes" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.TRY_ON_ACCESSORIES && <TryOnView type="accessories" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.HAIRSTYLE && <HairstyleView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.MAKEUP && <MakeupView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.BEAUTY_SCORE && <AnalysisView title={t('sections.beauty_score', '颜值打分')} type="颜值打分" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.COUPLE_FACE && <CoupleFaceView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.TONGUE_DIAGNOSIS && <AnalysisView title={t('sections.tongue_diagnosis', '趣味舌诊')} type="舌诊" onBack={() => setCurrentSection(AppSection.HOME)} helpText={t('ai.upload_photo', '请上传一张清晰的舌头照片哦～')} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.FACE_COLOR && <AnalysisView title={t('sections.face_color', '面色分析')} type="中医面色" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.FACE_READING && <AnalysisView title={t('sections.face_reading', '传统面相')} type="传统相术" onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.FENG_SHUI && <FengShuiView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.LICENSE_PLATE && <LicensePlateView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.CALENDAR && <CalendarView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.MBTI_TEST && <MBTITestView onBack={() => setCurrentSection(AppSection.HOME)} />}
                {currentSection === AppSection.EQ_TEST && <EQTestView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.IQ_TEST && <IQTestView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.BIG_FIVE && <BigFiveView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.DEPRESSION_TEST && <DepressionTestView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                { currentSection === AppSection.MARRIAGE_ANALYSIS && <MarriageView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                { currentSection === AppSection.WEALTH_ANALYSIS && <WealthView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                { currentSection === AppSection.ZI_WEI_DOU_SHU && <ZiWeiView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.JADE_APPRAISAL && <JadeAppraisalView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.AI_EYE_DIAGNOSIS && <EyeDiagnosisView onBack={() => setCurrentSection(AppSection.HOME)} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                {currentSection === AppSection.APP_DOWNLOAD && <DownloadAppView onBack={() => setCurrentSection(AppSection.HOME)} />}
                {currentSection === AppSection.LINKTREE && <LinktreeView />}
              </>
            )}

          </Suspense>
        </div>

        {!(showLogin || showAdmin || showMember || currentSection === AppSection.LINKTREE) && (
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-white/80 backdrop-blur-md border-t flex justify-around items-center px-4 z-50">
            <button onClick={() => setCurrentSection(AppSection.HOME)} className={`flex flex-col items-center gap-1 ${currentSection === AppSection.HOME ? 'text-pink-500' : 'text-gray-500'}`}>
              <span className="text-xl">🏠</span>
              <span className="text-xs">{t('common.home', '首页')}</span>
            </button>
            <button onClick={() => user ? setShowMember(true) : setShowLogin(true)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-pink-500">
              <span className="text-xl">{user ? '👤' : '🔐'}</span>
              <span className="text-xs">{user ? t('common.mine', '我的') : t('common.login')}</span>
            </button>
            {user?.is_admin && (
              <button onClick={() => setShowAdmin(true)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-500">
                <span className="text-xl">⚙️</span>
                <span className="text-xs">{t('common.admin', '管理')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
