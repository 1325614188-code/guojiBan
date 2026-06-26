import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppSection } from '../types';
import { INTRO_TRANSLATIONS, INTRO_UI_TRANSLATIONS, LanguageCode } from '../lib/intro-translations';

interface IntroductionViewProps {
  section: AppSection;
  onStart: () => void;
  onBack: () => void;
}

const IntroductionView: React.FC<IntroductionViewProps> = ({ section, onStart, onBack }) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as LanguageCode;
  
  const [copied, setCopied] = React.useState(false);

  const getSubProjectShareLink = (): string => {
    let inviteCode = '';
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.id) {
          inviteCode = parsed.id.slice(-6).toUpperCase();
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Map AppSection to path (aligned with SECTION_PATH_MAP in App.tsx)
    const sectionPaths: Record<string, string> = {
      'advanced-try-on': '/ato',
      'try-on-clothes': '/clt',
      'try-on-accessories': '/acc',
      'hairstyle': '/hrs',
      'makeup': '/mkp',
      'beauty-score': '/bts',
      'jade-appraisal': '/jda',
      'eye-diagnosis': '/eye',
      'tongue-diagnosis': '/tng',
      'face-color': '/fcl',
      'depression-test': '/dep',
      'couple-face': '/cpf',
      'face-reading': '/frd',
      'feng-shui': '/fsh',
      'license-plate': '/lpt',
      'calendar': '/cal',
      'marriage-analysis': '/mrg',
      'wealth-analysis': '/wth',
      'zi-wei-dou-shu': '/zwd',
      'mbti-test': '/mbt',
      'eq-test': '/eqt',
      'iq-test': '/iqt',
      'big-five': '/bgf',
    };
    
    const subPath = sectionPaths[section] || '';
    const origin = window.location.origin;
    if (inviteCode) {
      return `${origin}${subPath}?ref=${inviteCode}`;
    }
    return `${origin}${subPath}`;
  };

  const handleCopyShareLink = () => {
    const link = getSubProjectShareLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 智能降级兜底语言
  const langKey = INTRO_TRANSLATIONS[section] && INTRO_TRANSLATIONS[section][currentLang] 
    ? currentLang 
    : 'en';

  const introData = INTRO_TRANSLATIONS[section]?.[langKey] || {
    desc: 'AI-powered evaluation assistant. Discover hidden insights and patterns using state-of-the-art intelligent analysis models.',
    tips: 'Please follow the on-screen instructions and upload a clear photo for optimal results.'
  };

  // 根据 AppSection 绘制专属的精密科技感 SVG 矢量大图
  const renderGraphic = () => {
    switch (section) {
      case AppSection.ADVANCED_TRY_ON:
      case AppSection.TRY_ON_CLOTHES:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="clothGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            {/* 流光网格 */}
            <path d="M20 50 H180 M20 100 H180 M20 150 H180 M50 20 V180 M100 20 V180 M150 20 V180" stroke="rgba(244,114,182,0.15)" strokeWidth="0.5" />
            {/* 衣架 & 衣服轮廓 */}
            <path d="M100 50 L85 60 H115 L100 50 Z" stroke="url(#clothGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M85 60 L60 85 C60 85 70 95 75 90 L80 80 V160 H120 V80 L125 90 C130 95 140 85 140 85 L115 60" fill="rgba(167,139,250,0.1)" stroke="url(#clothGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* 魔法闪烁星光 */}
            <circle cx="50" cy="70" r="2" fill="#fb7185" className="animate-ping" />
            <circle cx="150" cy="130" r="3" fill="#f472b6" />
            <circle cx="140" cy="60" r="1.5" fill="#a78bfa" />
            {/* 扫描线动画 */}
            <line x1="40" y1="40" x2="160" y2="40" stroke="#f472b6" strokeWidth="1.5">
              <animate attributeName="y" values="55;165;55" dur="4s" repeatCount="indefinite" />
            </line>
          </svg>
        );
      case AppSection.TRY_ON_ACCESSORIES:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#fcd34d" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="60" stroke="rgba(251,113,133,0.15)" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="45" stroke="rgba(251,113,133,0.2)" strokeWidth="1" />
            {/* 钻石/珠宝 */}
            <path d="M100 50 L125 75 L100 130 L75 75 Z" fill="rgba(252,211,77,0.1)" stroke="url(#accGrad)" strokeWidth="2.5" strokeLinejoin="round" />
            <line x1="75" y1="75" x2="125" y2="75" stroke="url(#accGrad)" strokeWidth="1.5" />
            <line x1="100" y1="50" x2="100" y2="130" stroke="url(#accGrad)" strokeWidth="1" strokeDasharray="2 2" />
            {/* 发光粒子 */}
            <g transform="translate(100,100)">
              <circle cx="-55" cy="-20" r="2.5" fill="#fcd34d">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="30" r="1.5" fill="#f472b6" />
            </g>
          </svg>
        );
      case AppSection.HAIRSTYLE:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            {/* 魔镜外框 */}
            <rect x="55" y="40" width="90" height="120" rx="45" stroke="url(#hairGrad)" strokeWidth="2.5" fill="rgba(167,139,250,0.05)" />
            {/* 飘逸发丝 */}
            <path d="M75 90 C65 110 70 140 90 145 C110 150 125 130 120 110 C115 90 135 90 125 70 C115 50 85 50 75 90 Z" stroke="url(#hairGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M90 70 C85 85 95 105 100 120 C105 135 115 135 115 135" stroke="url(#hairGrad)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3" />
            {/* 星芒 */}
            <path d="M140 60 L143 65 L148 66 L143 67 L140 72 L137 67 L132 66 L137 65 Z" fill="#60a5fa" />
            <circle cx="60" cy="130" r="2" fill="#f472b6" />
          </svg>
        );
      case AppSection.MAKEUP:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="makeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            {/* 彩妆刷 & 口红 */}
            <rect x="70" y="100" width="15" height="50" rx="3" fill="#1f2937" stroke="url(#makeGrad)" strokeWidth="1" />
            <path d="M70 100 H85 L82 80 H73 Z" fill="url(#makeGrad)" />
            <path d="M73 80 C73 80 73 70 77.5 70 C82 70 82 80 82 80 Z" fill="#f43f5e" />
            
            {/* 刷子 */}
            <g transform="translate(40, -10) rotate(15 100 100)">
              <rect x="120" y="70" width="10" height="70" rx="2" fill="#374151" />
              <rect x="117" y="60" width="16" height="10" fill="#9ca3af" />
              <path d="M115 60 C115 45 135 45 135 60 Z" fill="#ec4899" />
            </g>
            <circle cx="50" cy="60" r="2" fill="#fb7185" />
            <circle cx="150" cy="140" r="3" fill="#f472b6" />
          </svg>
        );
      case AppSection.BEAUTY_SCORE:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="50%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            {/* 面部多边形轮廓 */}
            <path d="M100 35 L135 55 L145 95 L130 145 L100 170 L70 145 L55 95 L65 55 Z" stroke="url(#scoreGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(251,113,133,0.03)" />
            {/* 黄金对称线与定位锚点 */}
            <line x1="100" y1="30" x2="100" y2="175" stroke="#fcd34d" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="50" y1="95" x2="150" y2="95" stroke="#fcd34d" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="70" r="4" fill="#fb7185" />
            <circle cx="75" cy="95" r="4" fill="#a78bfa" />
            <circle cx="125" cy="95" r="4" fill="#a78bfa" />
            <circle cx="100" cy="120" r="4" fill="#fb7185" />
            {/* 扫描动画 */}
            <path d="M50 30 H150 V170 H50 Z" stroke="rgba(251,113,133,0.2)" strokeWidth="1" />
          </svg>
        );
      case AppSection.COUPLE_FACE:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cpGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            {/* 重合双心 */}
            <path d="M120 75 C120 60 100 60 100 75 C100 60 80 60 80 75 C80 95 100 115 100 115 C100 115 120 95 120 75 Z" fill="rgba(244,114,182,0.1)" stroke="url(#cpGrad)" strokeWidth="2.5" />
            <path d="M140 95 C140 80 120 80 120 95 C120 80 100 80 100 95 C100 115 120 135 120 135 C120 135 140 115 140 95 Z" fill="rgba(251,113,133,0.1)" stroke="url(#cpGrad)" strokeWidth="2" strokeDasharray="3 1" />
            {/* 连线与星光 */}
            <line x1="80" y1="75" x2="120" y2="95" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="100" cy="75" r="3.5" fill="#fcd34d" />
            <circle cx="120" cy="95" r="3.5" fill="#fcd34d" />
          </svg>
        );
      case AppSection.TONGUE_DIAGNOSIS:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="tongGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            {/* 舌头简图与反射区 */}
            <path d="M100 45 C65 45 60 110 65 130 C70 150 85 165 100 165 C115 165 130 150 135 130 C140 110 135 45 100 45 Z" fill="rgba(248,113,113,0.08)" stroke="url(#tongGrad)" strokeWidth="2.5" />
            <path d="M100 45 V165" stroke="rgba(244,114,182,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* 五脏分区线 */}
            <path d="M72 100 H128" stroke="rgba(248,113,113,0.3)" strokeWidth="1" />
            <path d="M66 130 H134" stroke="rgba(248,113,113,0.3)" strokeWidth="1" />
            {/* 焦点圈 */}
            <circle cx="100" cy="80" r="15" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="100" cy="145" r="10" stroke="#fcd34d" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        );
      case AppSection.FACE_COLOR:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="colorSpectrum" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="35%" stopColor="#f472b6" />
                <stop offset="70%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#34d399" />
              </radialGradient>
            </defs>
            {/* 热力色彩脸部 */}
            <path d="M100 40 C75 40 60 70 60 100 C60 135 78 160 100 160 C122 160 140 135 140 100 C140 70 125 40 100 40 Z" fill="url(#colorSpectrum)" opacity="0.35" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="40" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            {/* 树叶/调理流线 */}
            <path d="M40 130 Q60 160 100 150 T160 130" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case AppSection.FACE_READING:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="readGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            {/* 古风面相线描 */}
            <path d="M100 40 C70 40 60 70 60 100 C60 135 80 160 100 160 C120 160 140 135 140 100 C140 70 130 40 100 40 Z" stroke="url(#readGrad)" strokeWidth="2.5" />
            <path d="M60 100 C60 100 80 90 100 95 C120 90 140 100 140 100" stroke="url(#readGrad)" strokeWidth="1.5" />
            {/* 十二宫刻度标志 */}
            <circle cx="100" cy="55" r="3" fill="#d97706" />
            <circle cx="100" cy="115" r="3" fill="#d97706" />
            <circle cx="80" cy="80" r="3" fill="#d97706" />
            <circle cx="120" cy="80" r="3" fill="#d97706" />
            {/* 八卦外圈 */}
            <circle cx="100" cy="100" r="75" stroke="rgba(217,119,6,0.15)" strokeWidth="1.5" />
          </svg>
        );
      case AppSection.FENG_SHUI:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fengGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            {/* 旋转八卦盘 */}
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite" />
              <circle cx="100" cy="100" r="70" stroke="url(#fengGrad)" strokeWidth="3" />
              <circle cx="100" cy="100" r="50" stroke="url(#fengGrad)" strokeWidth="1.5" strokeDasharray="6 3" />
              {/* 八卦爻符示意 */}
              <path d="M90 40 H110 M90 45 H98 M102 45 H110" stroke="url(#fengGrad)" strokeWidth="2" />
              <path d="M90 160 H110" stroke="url(#fengGrad)" strokeWidth="2" />
              <path d="M40 90 V110" stroke="url(#fengGrad)" strokeWidth="2" />
              <path d="M160 90 V110" stroke="url(#fengGrad)" strokeWidth="2" />
            </g>
            {/* 中央太极阴阳鱼 */}
            <circle cx="100" cy="100" r="22" fill="#fff" stroke="url(#fengGrad)" strokeWidth="1.5" />
            <path d="M100 78 C88 78 88 100 100 100 C112 100 112 122 100 122 C88 122 78 112 78 100 C78 88 88 78 100 78 Z" fill="url(#fengGrad)" />
            <circle cx="100" cy="89" r="3.5" fill="#fff" />
            <circle cx="100" cy="111" r="3.5" fill="url(#fengGrad)" />
          </svg>
        );
      case AppSection.CALENDAR:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            {/* 老黄历卷轴 */}
            <path d="M60 40 H140 V160 H60 Z" fill="rgba(245,158,11,0.05)" stroke="url(#calGrad)" strokeWidth="2" />
            <path d="M55 35 H145 V40 H55 Z M55 160 H145 V165 H55 Z" fill="url(#calGrad)" />
            {/* 祥云图案 */}
            <path d="M80 65 Q85 60 90 65 Q95 60 100 65 T120 65" stroke="url(#calGrad)" strokeWidth="1.5" strokeLinecap="round" />
            {/* 宜吉字样代表 */}
            <rect x="75" y="85" width="50" height="45" rx="5" stroke="url(#calGrad)" strokeWidth="1.5" fill="rgba(245,158,11,0.1)" />
            <text x="100" y="112" fontFamily="serif" fontSize="20" fontWeight="bold" fill="#d97706" textAnchor="middle">吉</text>
          </svg>
        );
      case AppSection.LICENSE_PLATE:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="plateGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            {/* 车牌框架 */}
            <rect x="40" y="70" width="120" height="60" rx="8" fill="rgba(59,130,246,0.05)" stroke="url(#plateGrad)" strokeWidth="3" />
            <rect x="46" y="76" width="108" height="48" rx="4" stroke="url(#plateGrad)" strokeWidth="1" strokeDasharray="3 3" />
            {/* 模拟发光字 */}
            <text x="100" y="110" fontFamily="sans-serif" fontSize="24" fontWeight="black" fill="#3b82f6" textAnchor="middle" letterSpacing="2">A·8888</text>
            {/* 五行环绕环 */}
            <circle cx="100" cy="100" r="68" stroke="rgba(96,165,250,0.2)" strokeWidth="1.5" />
          </svg>
        );
      case AppSection.MBTI_TEST:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="mbtiLGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="mbtiRGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            {/* 左脑：逻辑齿轮 */}
            <path d="M100 45 C75 45 65 65 65 95 C65 125 75 145 100 145 Z" fill="rgba(59,130,246,0.08)" stroke="url(#mbtiLGrad)" strokeWidth="2.5" />
            <circle cx="85" cy="95" r="10" stroke="url(#mbtiLGrad)" strokeWidth="1.5" />
            <line x1="85" y1="80" x2="85" y2="110" stroke="url(#mbtiLGrad)" strokeWidth="1" />
            <line x1="70" y1="95" x2="100" y2="95" stroke="url(#mbtiLGrad)" strokeWidth="1" />
            {/* 右脑：创意思维 */}
            <path d="M100 45 C125 45 135 65 135 95 C135 125 125 145 100 145 Z" fill="rgba(244,114,182,0.08)" stroke="url(#mbtiRGrad)" strokeWidth="2.5" />
            <path d="M110 80 Q125 85 115 105 T130 120" stroke="url(#mbtiRGrad)" strokeWidth="2" strokeLinecap="round" />
            {/* 发光创意泡泡 */}
            <circle cx="120" cy="70" r="5" fill="#f472b6" />
            <circle cx="125" cy="100" r="3" fill="#a78bfa" />
          </svg>
        );
      case AppSection.DEPRESSION_TEST:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#4b5563" />
              </linearGradient>
            </defs>
            {/* 乌云与雨水 */}
            <path d="M70 80 C60 80 55 90 65 95 C60 105 75 110 85 105 C90 115 115 115 120 105 C130 108 135 95 130 90 C135 80 120 70 110 75 C100 65 80 70 70 80 Z" fill="url(#depGrad)" opacity="0.3" />
            <line x1="75" y1="120" x2="70" y2="135" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" />
            <line x1="95" y1="122" x2="90" y2="137" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" />
            <line x1="115" y1="120" x2="110" y2="135" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" />
            {/* 新生绿芽 */}
            <path d="M100 160 V125" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M100 135 C100 135 112 130 115 120 C110 120 102 130 100 135 Z" fill="#34d399" />
            <path d="M100 145 C100 145 88 140 85 130 C90 130 98 140 100 145 Z" fill="#34d399" />
          </svg>
        );
      case AppSection.MARRIAGE_ANALYSIS:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="mrgGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#fda4af" />
              </linearGradient>
            </defs>
            {/* 月亮 */}
            <path d="M140 50 C100 50 70 80 70 120 C70 140 80 160 95 170 C80 150 80 110 110 80 C130 60 150 70 160 80 C155 60 150 50 140 50 Z" fill="rgba(244,63,94,0.05)" stroke="url(#mrgGrad)" strokeWidth="1.5" />
            {/* 红线连接 */}
            <path d="M70 120 Q100 90 130 130 T170 100" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 3" />
            {/* 翩飞蝴蝶 */}
            <g transform="translate(60, 95) rotate(-20)">
              <path d="M10 10 C5 0 0 5 5 15 C10 20 20 15 10 10 Z" fill="url(#mrgGrad)" />
              <path d="M10 10 C15 0 20 5 15 15 C10 20 0 15 10 10 Z" fill="url(#mrgGrad)" />
            </g>
            <circle cx="130" cy="130" r="3.5" fill="#f43f5e" />
          </svg>
        );
      case AppSection.WEALTH_ANALYSIS:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wthGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            {/* 上升财运波形 */}
            <path d="M40 150 L80 120 L120 135 L160 80" stroke="url(#wthGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M160 80 H140 M160 80 V100" stroke="url(#wthGrad)" strokeWidth="3" strokeLinecap="round" />
            {/* 金币 */}
            <circle cx="80" cy="120" r="8" fill="rgba(245,158,11,0.1)" stroke="url(#wthGrad)" strokeWidth="1.5" />
            <circle cx="120" cy="135" r="8" fill="rgba(245,158,11,0.1)" stroke="url(#wthGrad)" strokeWidth="1.5" />
            <circle cx="160" cy="80" r="10" fill="rgba(245,158,11,0.2)" stroke="url(#wthGrad)" strokeWidth="2" />
            <line x1="80" y1="116" x2="80" y2="124" stroke="url(#wthGrad)" strokeWidth="1.5" />
            <line x1="120" y1="131" x2="120" y2="139" stroke="url(#wthGrad)" strokeWidth="1.5" />
          </svg>
        );
      case AppSection.AI_EYE_DIAGNOSIS:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="eyeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="60%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </radialGradient>
            </defs>
            {/* 眼睑轮廓 */}
            <path d="M40 100 C70 60 130 60 160 100 C130 140 70 140 40 100 Z" stroke="url(#eyeGrad)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(96,165,250,0.03)" />
            {/* 虹膜瞳孔 */}
            <circle cx="100" cy="100" r="28" fill="url(#irisGrad)" stroke="url(#eyeGrad)" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="12" fill="#0f172a" />
            <circle cx="94" cy="94" r="3.5" fill="#fff" opacity="0.8" />
            {/* 扫描准心 */}
            <path d="M80 70 H65 V85 M120 70 H135 V85 M80 130 H65 V115 M120 130 H135 V115" stroke="#fcd34d" strokeWidth="1.5" />
          </svg>
        );
      case AppSection.EQ_TEST:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
            {/* 捧着爱心的手掌 */}
            <path d="M70 140 C70 140 85 110 100 110 C115 110 130 140 130 140 V160 H70 Z" fill="rgba(244,114,182,0.05)" stroke="url(#eqGrad)" strokeWidth="2" />
            {/* 情感爱心能量 */}
            <path d="M100 65 C100 55 90 50 82.5 57.5 C75 65 100 95 100 95 C100 95 125 65 117.5 57.5 C110 50 100 55 100 65 Z" fill="url(#eqGrad)" />
            {/* 多彩气流 */}
            <path d="M60 90 Q75 75 90 85" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M140 80 Q125 70 110 80" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case AppSection.IQ_TEST:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="iqGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            {/* 几何魔方三维 */}
            <g transform="translate(100, 100)">
              {/* 正方体三个可视面面描 */}
              <path d="M0 -45 L39 -22 L0 0 L-39 -22 Z" fill="rgba(96,165,250,0.1)" stroke="url(#iqGrad)" strokeWidth="2" />
              <path d="M-39 -22 L0 0 V45 L-39 22 Z" fill="rgba(167,139,250,0.1)" stroke="url(#iqGrad)" strokeWidth="2" />
              <path d="M39 -22 L0 0 V45 L39 22 Z" fill="rgba(96,165,250,0.05)" stroke="url(#iqGrad)" strokeWidth="2.5" />
            </g>
            {/* 星座连线 */}
            <circle cx="100" cy="40" r="3" fill="#60a5fa" />
            <circle cx="50" cy="80" r="3" fill="#a78bfa" />
            <circle cx="150" cy="80" r="3" fill="#a78bfa" />
            <line x1="100" y1="40" x2="50" y2="80" stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
            <line x1="100" y1="40" x2="150" y2="80" stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
          </svg>
        );
      case AppSection.BIG_FIVE:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bfGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            {/* 五角雷达图底网 */}
            <path d="M100 40 L152 78 L132 138 L68 138 L48 78 Z" stroke="rgba(96,165,250,0.2)" strokeWidth="1" />
            <path d="M100 60 L139 88 L124 128 L76 128 L61 88 Z" stroke="rgba(96,165,250,0.2)" strokeWidth="1" />
            <path d="M100 80 L126 99 L116 119 L84 119 L74 99 Z" stroke="rgba(96,165,250,0.2)" strokeWidth="1" />
            {/* 测评雷达得分网 */}
            <path d="M100 50 L145 83 L116 128 L84 119 L58 88 Z" fill="rgba(244,114,182,0.12)" stroke="url(#bfGrad)" strokeWidth="2.5" strokeLinejoin="round" />
            {/* 五个顶角点 */}
            <circle cx="100" cy="50" r="3.5" fill="#f472b6" />
            <circle cx="145" cy="83" r="3.5" fill="#60a5fa" />
            <circle cx="116" cy="128" r="3.5" fill="#60a5fa" />
            <circle cx="84" cy="119" r="3.5" fill="#f472b6" />
            <circle cx="58" cy="88" r="3.5" fill="#f472b6" />
          </svg>
        );
      case AppSection.ZI_WEI_DOU_SHU:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ziGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            {/* 北斗七星连线 */}
            <g opacity="0.8">
              <path d="M45 60 L65 55 L90 65 L105 85 L125 110 L155 112 L165 90" stroke="url(#ziGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="45" cy="60" r="2.5" fill="#a78bfa" />
              <circle cx="65" cy="55" r="2.5" fill="#a78bfa" />
              <circle cx="90" cy="65" r="2.5" fill="#a78bfa" />
              <circle cx="105" cy="85" r="2.5" fill="#a78bfa" />
              <circle cx="125" cy="110" r="3" fill="#fcd34d" />
              <circle cx="155" cy="112" r="2.5" fill="#a78bfa" />
              <circle cx="165" cy="90" r="2.5" fill="#a78bfa" />
            </g>
            {/* 紫微帝星 */}
            <circle cx="100" cy="120" r="8" fill="rgba(124,58,237,0.2)" />
            <polygon points="100,105 104,115 115,120 104,125 100,135 96,125 85,120 96,115" fill="#fcd34d" />
          </svg>
        );
      case AppSection.JADE_APPRAISAL:
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="jadeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            {/* 玉石壁轮廓 */}
            <circle cx="100" cy="100" r="55" fill="rgba(52,211,153,0.06)" stroke="url(#jadeGrad)" strokeWidth="4" />
            <circle cx="100" cy="100" r="18" fill="none" stroke="url(#jadeGrad)" strokeWidth="2" />
            {/* 祥云玉坠雕刻线 */}
            <path d="M70 90 C70 90 85 85 100 90 C115 85 130 90 130 90" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
            <path d="M75 110 C75 110 90 115 100 110 C110 115 125 110 125 110" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
            {/* AI 放大镜扫描 */}
            <g transform="translate(20, 20)">
              <circle cx="110" cy="110" r="18" stroke="#fcd34d" strokeWidth="2.5" fill="rgba(252,211,77,0.03)" />
              <line x1="123" y1="123" x2="135" y2="135" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        );
      default:
        // 通用科技风格大图
        return (
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="defGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="60" stroke="url(#defGrad)" strokeWidth="2.5" strokeDasharray="5 5" />
            <polygon points="100,55 138,125 62,125" fill="rgba(96,165,250,0.08)" stroke="url(#defGrad)" strokeWidth="2" />
            <circle cx="100" cy="100" r="10" fill="#f472b6" />
          </svg>
        );
    }
  };

  // 根据板块类型返回美学底色与标题分类名
  const getCategoryAndTheme = () => {
    const isAesthetic = [AppSection.TRY_ON_CLOTHES, AppSection.ADVANCED_TRY_ON, AppSection.TRY_ON_ACCESSORIES, AppSection.HAIRSTYLE, AppSection.MAKEUP, AppSection.BEAUTY_SCORE, AppSection.COUPLE_FACE].includes(section);
    const isHealth = [AppSection.TONGUE_DIAGNOSIS, AppSection.FACE_COLOR, AppSection.AI_EYE_DIAGNOSIS].includes(section);
    const isMetaphysics = [AppSection.FENG_SHUI, AppSection.CALENDAR, AppSection.LICENSE_PLATE, AppSection.MARRIAGE_ANALYSIS, AppSection.WEALTH_ANALYSIS, AppSection.ZI_WEI_DOU_SHU].includes(section);
    const isAppraisal = [AppSection.JADE_APPRAISAL].includes(section);
    
    if (isAesthetic) {
      return { category: INTRO_UI_TRANSLATIONS.aesthetic[langKey] || 'Aesthetics', themeColor: 'from-pink-500 to-purple-600', badgeBg: 'bg-pink-100 text-pink-600' };
    }
    if (isHealth) {
      return { category: INTRO_UI_TRANSLATIONS.health[langKey] || 'Health Check', themeColor: 'from-emerald-500 to-teal-600', badgeBg: 'bg-emerald-100 text-emerald-600' };
    }
    if (isAppraisal) {
      return { category: (INTRO_UI_TRANSLATIONS as any).appraisal?.[langKey] || 'AI Appraisal', themeColor: 'from-cyan-500 to-blue-600', badgeBg: 'bg-cyan-100 text-cyan-700' };
    }
    if (isMetaphysics) {
      return { category: INTRO_UI_TRANSLATIONS.metaphysics[langKey] || 'Metaphysics', themeColor: 'from-amber-500 to-red-600', badgeBg: 'bg-amber-100 text-amber-700' };
    }
    return { category: INTRO_UI_TRANSLATIONS.psychology[langKey] || 'Psychology', themeColor: 'from-blue-500 to-indigo-600', badgeBg: 'bg-blue-100 text-blue-600' };
  };

  const { category, themeColor, badgeBg } = getCategoryAndTheme();

  // 是否需要额度测试提示
  const isFreeTest = [AppSection.MBTI_TEST].includes(section);

  return (
    <div className="min-h-full flex flex-col p-6 text-gray-800 animate-in fade-in duration-300">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-lg border border-pink-100 active:scale-95 transition-all text-gray-600"
        >
          ←
        </button>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeBg} shadow-sm`}>
          {category}
        </span>
        <button 
          onClick={handleCopyShareLink}
          title={t('common.share_project_link')}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center text-sm border border-pink-100 active:scale-95 transition-all text-pink-500 relative"
        >
          {copied ? '✅' : '🔗'}
          {copied && (
            <span className="absolute bottom-full mb-2 right-0 bg-gray-900/90 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
              {t('common.share_project_success')}
            </span>
          )}
        </button>
      </div>

      {/* 精密矢量大图卡片 */}
      <div className="w-full aspect-[4/3] rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl overflow-hidden p-6 mb-8 flex items-center justify-center relative">
        {/* 背景渲染流光特效 */}
        <div className={`absolute -top-20 -left-20 w-44 h-44 rounded-full bg-gradient-to-tr ${themeColor} opacity-20 blur-3xl`} />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 opacity-20 blur-3xl" />
        
        {/* 矢量内容 */}
        <div className="w-48 h-48 relative z-10 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
          {renderGraphic()}
        </div>
      </div>

      {/* 项目详情文案 */}
      <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 p-6 shadow-xl mb-6">
        <h1 className="text-2xl font-black mb-3 text-gray-900 tracking-tight flex items-center gap-2">
          {t(`sections.${section.replace(/-/g, '_')}`)}
        </h1>
        
        <div className="h-px bg-gradient-to-r from-pink-200 to-transparent mb-4" />

        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
            {INTRO_UI_TRANSLATIONS.mechanism[langKey] || 'AI Analysis Mechanism'}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
            {introData.desc}
          </p>

          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
            {INTRO_UI_TRANSLATIONS.preparations[langKey] || 'Preparation Tips'}
          </h3>
          <div className="flex items-start gap-2 bg-pink-50/50 p-3 rounded-2xl border border-pink-100/50 mb-4">
            <span className="text-pink-500 text-sm">💡</span>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              {introData.tips}
            </p>
          </div>

          {/* 推广分享入口 */}
          <div 
            onClick={handleCopyShareLink}
            className="flex items-start gap-2.5 bg-gradient-to-r from-pink-50/70 to-purple-50/70 p-3 rounded-2xl border border-pink-100/60 cursor-pointer hover:from-pink-100/50 hover:to-purple-100/50 active:scale-[0.99] transition-all select-none"
          >
            <span className="text-pink-500 text-sm mt-0.5">📢</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-pink-600 block mb-0.5">
                {t('common.share_project_link')}
              </span>
              <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                {t('common.share_project_tip')}
              </p>
            </div>
            <span className="text-xs bg-pink-500 text-white font-bold px-2 py-0.5 rounded-full shrink-0 scale-90 self-center">
              {copied ? '✓' : 'Copy'}
            </span>
          </div>
        </div>

        {/* 底部功能按钮 */}
        <button
          onClick={onStart}
          className={`w-full py-4 rounded-2xl bg-gradient-to-r ${themeColor} text-white font-bold text-base shadow-lg shadow-pink-500/20 active:scale-[0.98] active:brightness-95 transition-all mt-6`}
        >
          {isFreeTest 
            ? (INTRO_UI_TRANSLATIONS.start_free[langKey] || 'Start Free Evaluation') 
            : `${INTRO_UI_TRANSLATIONS.start_test[langKey] || 'Start Test'} ${INTRO_UI_TRANSLATIONS.use_credit_desc[langKey] || '(Cost 1 Credit)'}`}
        </button>
      </div>
    </div>
  );
};

export default IntroductionView;
