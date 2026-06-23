
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
import IntroductionView from './components/IntroductionView';


// 路由板块与子路径双向映射表
const SECTION_PATH_MAP: Record<AppSection, string> = {
  [AppSection.HOME]: '/',
  [AppSection.JADE_APPRAISAL]: '/jade-appraisal',
  [AppSection.TRY_ON_CLOTHES]: '/clothes',
  [AppSection.ADVANCED_TRY_ON]: '/advanced-try-on',
  [AppSection.TRY_ON_ACCESSORIES]: '/accessories',
  [AppSection.HAIRSTYLE]: '/hairstyle',
  [AppSection.MAKEUP]: '/makeup',
  [AppSection.BEAUTY_SCORE]: '/beauty-score',
  [AppSection.COUPLE_FACE]: '/couple-face',
  [AppSection.TONGUE_DIAGNOSIS]: '/tongue-diagnosis',
  [AppSection.FACE_COLOR]: '/face-color',
  [AppSection.FACE_READING]: '/face-reading',
  [AppSection.FENG_SHUI]: '/feng-shui',
  [AppSection.CALENDAR]: '/calendar',
  [AppSection.LICENSE_PLATE]: '/license-plate',
  [AppSection.MBTI_TEST]: '/mbti-test',
  [AppSection.DEPRESSION_TEST]: '/depression-test',
  [AppSection.MARRIAGE_ANALYSIS]: '/marriage-analysis',
  [AppSection.WEALTH_ANALYSIS]: '/wealth-analysis',
  [AppSection.AI_EYE_DIAGNOSIS]: '/eye-diagnosis',
  [AppSection.EQ_TEST]: '/eq-test',
  [AppSection.IQ_TEST]: '/iq-test',
  [AppSection.BIG_FIVE]: '/big-five',
  [AppSection.ZI_WEI_DOU_SHU]: '/zi-wei-dou-shu',
  [AppSection.APP_DOWNLOAD]: '/app-download',
  [AppSection.LINKTREE]: '/linktree',
  [AppSection.ADMIN]: '/admin',
};

// 从路径中解析对应的板块
const getSectionFromPath = (path: string): AppSection => {
  const cleanPath = path.replace(/\/$/, '') || '/';
  const entries = Object.entries(SECTION_PATH_MAP);
  const found = entries.find(([_, p]) => p === cleanPath);
  return found ? (found[0] as AppSection) : AppSection.HOME;
};

const App: React.FC = () => {
    const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  // 【问题1修复】user 类型从 any 改为 User | null
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showMember, setShowMember] = useState(false);

  // 【问题2修复】并发锁：防止 checkCredits 通过后在 AI 处理期间被再次调用
  const isProcessingRef = useRef(false);

  // 【问题5修复】用 ref 保存最新的状态值，供返回键回调读取，避免闭包陷阱
  const currentSectionRef = useRef(currentSection);
  const showLoginRef = useRef(showLogin);
  const showMemberRef = useRef(showMember);
  const { t } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [introActive, setIntroActive] = useState(true);

  // 路由变化时自动重置介绍落地页展示状态
  useEffect(() => {
    setIntroActive(true);
  }, [currentSection]);


  // 同步 state 到 ref（每次 state 变化时自动更新）
  useEffect(() => { currentSectionRef.current = currentSection; }, [currentSection]);
  useEffect(() => { showLoginRef.current = showLogin; }, [showLogin]);
  useEffect(() => { showMemberRef.current = showMember; }, [showMember]);

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

  // 3. 全局路由路径检测与浏览器历史（前进/后退）被动同步监听
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const section = getSectionFromPath(path);
      const hasUser = !!localStorage.getItem('user');

      // 1) 后台管理路由校验
      if (section === AppSection.ADMIN) {
        if (!hasUser) {
          // 未登录访问后台管理，重定向至首页并弹出登录框
          setCurrentSection(AppSection.HOME);
          window.history.replaceState({ section: AppSection.HOME }, '', '/');
          setShowLogin(true);
          return;
        }

        try {
          const parsedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (!parsedUser.is_admin) {
            // 已登录但非管理员，越权拦截，弹窗警告并退回首页
            alert(t('common.no_admin_permission', '您不是管理员，无权访问后台管理系统'));
            setCurrentSection(AppSection.HOME);
            window.history.replaceState({ section: AppSection.HOME }, '', '/');
            return;
          }
        } catch {
          setCurrentSection(AppSection.HOME);
          window.history.replaceState({ section: AppSection.HOME }, '', '/');
          return;
        }
      }

      // 2) 其它页面的通用鉴权与豁免
      const isExempt = section === AppSection.HOME || section === AppSection.APP_DOWNLOAD || section === AppSection.LINKTREE;

      if (!isExempt && !hasUser) {
        setCurrentSection(AppSection.HOME);
        window.history.replaceState({ section: AppSection.HOME }, '', '/');
        setShowLogin(true);
      } else {
        setCurrentSection(section);
      }
    };

    // 初始化检测
    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);


  // 4. Android 物理返回键监听 (Effect #4)

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    setShowLogin(false);
    if (u.is_admin) {
      handleNavigate(AppSection.ADMIN);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowMember(false);
    setCurrentSection(AppSection.HOME); // 登出时返回首页
  };

  /**
   * 统一导航处理（带逻辑拦截，支持 URL 主动更新）
   */
  const handleNavigate = (section: AppSection, pushState = true) => {
    // 1) 后台管理路由前置权限拦截
    if (section === AppSection.ADMIN) {
      if (!user) {
        setShowLogin(true);
        return;
      }
      if (!user.is_admin) {
        alert(t('common.no_admin_permission', '您不是管理员，无权访问后台管理系统'));
        return;
      }
      setCurrentSection(section);
      if (pushState) {
        const targetPath = SECTION_PATH_MAP[section] || '/';
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ section }, '', targetPath);
        }
      }
      return;
    }

    // 2) 其它豁免区域：首页、App 下载和导航页
    if (section === AppSection.HOME || section === AppSection.APP_DOWNLOAD || section === AppSection.LINKTREE) {
      setCurrentSection(section);
      if (pushState) {
        const targetPath = SECTION_PATH_MAP[section] || '/';
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ section }, '', targetPath);
        }
      }
      return;
    }

    // 3) 其它页面通用鉴权拦截
    if (!user) {
      setShowLogin(true);
      return;
    }

    setCurrentSection(section);
    if (pushState) {
      const targetPath = SECTION_PATH_MAP[section] || '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ section }, '', targetPath);
      }
    }
  };

  /**
   * 统一返回逻辑，用于将状态和 URL 同步重置回首页
   */
  const handleBack = () => {
    handleNavigate(AppSection.HOME);
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

            {!showLogin && currentSection === AppSection.ADMIN && user?.is_admin && <AdminView admin={user} onBack={handleBack} />}

            {!showLogin && currentSection !== AppSection.ADMIN && showMember && user && <MemberView user={user} onLogout={handleLogout} onBack={() => setShowMember(false)} onUserUpdate={handleUserUpdate} />}

            {!showLogin && currentSection !== AppSection.ADMIN && !showMember && (
              <>
                {currentSection === AppSection.HOME && <HomeView onNavigate={handleNavigate} onShowLogin={() => setShowLogin(true)} />}
                {currentSection === AppSection.LINKTREE && <LinktreeView />}
                {currentSection === AppSection.APP_DOWNLOAD && <DownloadAppView onBack={handleBack} />}

                {currentSection !== AppSection.HOME &&
                 currentSection !== AppSection.LINKTREE &&
                 currentSection !== AppSection.APP_DOWNLOAD && (
                  introActive ? (
                    <IntroductionView 
                      section={currentSection} 
                      onStart={() => setIntroActive(false)} 
                      onBack={handleBack} 
                    />
                  ) : (
                    <>
                      {currentSection === AppSection.ADVANCED_TRY_ON && <AdvancedTryOnView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.TRY_ON_CLOTHES && <TryOnView type="clothes" onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.TRY_ON_ACCESSORIES && <TryOnView type="accessories" onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.HAIRSTYLE && <HairstyleView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.MAKEUP && <MakeupView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.BEAUTY_SCORE && <AnalysisView title={t('sections.beauty_score', '颜值打分')} type="颜值打分" onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.COUPLE_FACE && <CoupleFaceView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.TONGUE_DIAGNOSIS && <AnalysisView title={t('sections.tongue_diagnosis', '趣味舌诊')} type="舌诊" onBack={handleBack} helpText={t('ai.upload_photo', '请上传一张清晰的舌头照片哦～')} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.FACE_COLOR && <AnalysisView title={t('sections.face_color', '面色分析')} type="中医面色" onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.FACE_READING && <AnalysisView title={t('sections.face_reading', '传统面相')} type="传统相术" onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.FENG_SHUI && <FengShuiView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.LICENSE_PLATE && <LicensePlateView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.CALENDAR && <CalendarView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.MBTI_TEST && <MBTITestView onBack={handleBack} />}
                      {currentSection === AppSection.EQ_TEST && <EQTestView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.IQ_TEST && <IQTestView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.BIG_FIVE && <BigFiveView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.DEPRESSION_TEST && <DepressionTestView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.MARRIAGE_ANALYSIS && <MarriageView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.WEALTH_ANALYSIS && <WealthView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.ZI_WEI_DOU_SHU && <ZiWeiView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.JADE_APPRAISAL && <JadeAppraisalView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                      {currentSection === AppSection.AI_EYE_DIAGNOSIS && <EyeDiagnosisView onBack={handleBack} onCheckCredits={checkCredits} onDeductCredit={deductCredit} onResetLock={() => { isProcessingRef.current = false; }} />}
                    </>
                  )
                )}
              </>
            )}

          </Suspense>
        </div>

        {!(showLogin || currentSection === AppSection.ADMIN || showMember || currentSection === AppSection.LINKTREE) && (
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-white/80 backdrop-blur-md border-t flex justify-around items-center px-4 z-50">
            <button onClick={() => handleNavigate(AppSection.HOME)} className={`flex flex-col items-center gap-1 ${currentSection === AppSection.HOME ? 'text-pink-500' : 'text-gray-500'}`}>
              <span className="text-xl">🏠</span>
              <span className="text-xs">{t('common.home', '首页')}</span>
            </button>
            <button onClick={() => user ? setShowMember(true) : setShowLogin(true)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-pink-500">
              <span className="text-xl">{user ? '👤' : '🔐'}</span>
              <span className="text-xs">{user ? t('common.mine', '我的') : t('common.login')}</span>
            </button>
            {user?.is_admin && (
              <button onClick={() => handleNavigate(AppSection.ADMIN)} className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-500">
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
