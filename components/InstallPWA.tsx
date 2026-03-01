/**
 * PWA Install Button Component
 * NOTE: Listens to beforeinstallprompt event and provides "Add to Home Screen" functionality
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../lib/i18n';

// 定义 BeforeInstallPromptEvent 类型
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

const InstallPWA: React.FC = () => {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showGuide, setShowGuide] = useState<null | 'ios' | 'social'>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const ua = window.navigator.userAgent;
        setIsMobile(/Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua));

        // 检查是否已经安装
        const checkIfInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
                setIsInstalled(true);
                return true;
            }
            return false;
        };

        if (checkIfInstalled()) return;

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        const ua = window.navigator.userAgent;
        const isWechat = /MicroMessenger/i.test(ua);
        const isQQ = /QQ\//i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua);

        if (isWechat || isQQ) {
            setShowGuide('social');
            return;
        }

        if (isIOS) {
            setShowGuide('ios');
            return;
        }

        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setDeferredPrompt(null);
        } else {
            alert(t('need_help'));
        }
    };

    if (isInstalled || !isMobile) return null;

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="w-full h-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 text-sm"
            >
                <span className="text-xl">📲</span>
                <span className="whitespace-nowrap">{t('add_to_home_screen')}</span>
            </button>

            {/* 引导弹窗 */}
            {showGuide && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6" onClick={() => setShowGuide(null)}>
                    <div className="bg-white rounded-3xl p-6 w-full max-sm" onClick={e => e.stopPropagation()}>
                        {showGuide === 'ios' ? (
                            <div className="text-center">
                                <h3 className="text-xl font-bold mb-4">{t('add_to_home_screen')}</h3>
                                <div className="space-y-4 text-left text-gray-600">
                                    <p>1. {t('ios_guide_step1')} ⬆️</p>
                                    <p>2. {t('ios_guide_step2')} ➕</p>
                                    <p>3. {t('ios_guide_step3')}</p>
                                </div>
                                <button onClick={() => setShowGuide(null)} className="mt-8 w-full py-3 bg-pink-500 text-white rounded-xl font-bold">{t('back')}</button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <h3 className="text-xl font-bold mb-4">{t('add_to_home_screen')}</h3>
                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                    {t('social_guide_tip')} ✨
                                </p>
                                <button
                                    onClick={() => setShowGuide(null)}
                                    className="w-full py-3 bg-gray-100 text-gray-800 font-bold rounded-xl active:scale-95 transition-all"
                                >
                                    {t('back')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPWA;
