import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../lib/api-config';
import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LinkItem {
    id: string;
    title: string;
    url: string;
    logo_url?: string;
    translations?: Record<string, string>;
}

interface BannerItem {
    id: string;
    image_url: string;
}

const LinktreeView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    useEffect(() => {
        document.body.style.backgroundColor = '#f8fafc';
        loadData();

        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    // 轮播逻辑
    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentBannerIndex(prev => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [banners]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Banners
            const bRes = await fetch(getApiUrl('/api/linktree?action=getPublicBanners'));
            const bData = await bRes.json();
            if (bData.success) setBanners(bData.banners);

            // Fetch Links
            const lRes = await fetch(getApiUrl('/api/linktree?action=getPublicLinks'));
            const lData = await lRes.json();
            if (lData.success) setLinks(lData.links);
        } catch (e) {
            console.error('Failed to load Linktree data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkClick = async (link: LinkItem, e: React.MouseEvent) => {
        e.preventDefault();
        try {
            // 使用 await 并开启 keepalive 确保日志在跳转前(或跳转中)记录成功
            await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logVisit', linkId: link.id }),
                keepalive: true
            });
        } catch (err) {
            console.error('Failed to log visit', err);
        }
        window.location.href = link.url;
    };

    const handleShare = () => {
        const shareText = t('linktree.share_text');
        if (navigator.share) {
            navigator.share({
                title: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert(t('linktree.copy_success'));
        }
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden pt-8 pb-24 px-6 z-0">
            {/* Premium Dynamic Background */}
            <div className="fixed inset-0 bg-slate-50 -z-20" />
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(45%_45%_at_top_right,#e0f2fe_0%,transparent_100%)] opacity-70" />
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(40%_40%_at_bottom_left,#f0fdf4_0%,transparent_100%)] opacity-60" />

            <div className="max-w-md mx-auto w-full flex flex-col items-center">
                
                {/* Share Button */}
                <div className="w-full flex justify-end mb-4">
                    <button 
                        onClick={handleShare}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/60 backdrop-blur-xl shadow-sm border border-white/60 text-slate-700 hover:bg-white/80 transition-all active:scale-90"
                    >
                        <Share2 size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Banner Carousel (16:9) */}
                <div className="w-full relative aspect-[16/9] mb-8 rounded-[2rem] overflow-hidden shadow-2xl border border-white/50 bg-slate-200 group animate-in fade-in slide-in-from-top-6 duration-1000">
                    {banners.length > 0 ? (
                        <>
                            <div className="w-full h-full flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}>
                                {banners.map((banner, idx) => (
                                    <img 
                                        key={banner.id} 
                                        src={banner.image_url} 
                                        className="w-full h-full object-cover shrink-0" 
                                        alt={`Banner ${idx}`} 
                                    />
                                ))}
                            </div>
                            {banners.length > 1 && (
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4">
                                    {banners.map((_, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setCurrentBannerIndex(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${currentBannerIndex === idx ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                             <div className="text-3xl">🖼️</div>
                             <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Welcome to Beauty Lab</p>
                        </div>
                    )}
                </div>

                {/* Link Items */}
                <div className="w-full space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4 py-16">
                            <div className="w-12 h-12 rounded-2xl border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                            <p className="text-blue-500/60 text-[10px] font-bold tracking-[0.2em] uppercase">{t('linktree.loading_experience')}</p>
                        </div>
                    ) : links.length === 0 ? (
                        <div className="text-center py-16 px-8 bg-white/40 backdrop-blur-md rounded-3xl border border-white/50 shadow-sm">
                            <div className="text-4xl mb-4 grayscale">🌊</div>
                            <p className="text-slate-400 text-sm font-medium">{t('linktree.empty_state')}</p>
                        </div>
                    ) : (
                        links.map((link, index) => {
                            const localizedTitle = (link.translations && link.translations[i18n.language]) || link.title;
                            return (
                                <a 
                                    key={link.id} 
                                    href={link.url}
                                    onClick={(e) => handleLinkClick(link, e)}
                                    className="group relative flex items-center w-full p-4.5 rounded-[1.5rem] bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] active:scale-[0.97] animate-in fade-in slide-in-from-bottom-6"
                                    style={{ 
                                        animationDelay: `${index * 120 + 400}ms`,
                                        animationFillMode: 'both'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[1.5rem]" />
                                    
                                    <div className="relative z-10 w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-white/60 group-hover:scale-110 transition-transform duration-500">
                                        {link.logo_url ? (
                                            <img 
                                                src={link.logo_url} 
                                                alt={localizedTitle} 
                                                className="w-full h-full object-cover bg-white"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/shapes/svg?seed=' + link.id }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-black text-lg">
                                                {localizedTitle.substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 px-4">
                                        <h3 className="font-bold text-slate-800 text-md tracking-tight group-hover:text-blue-600 transition-colors">{localizedTitle}</h3>
                                    </div>
                                    
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                                    </div>
                                </a>
                            );
                        })
                    )}
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-20 text-center animate-in fade-in duration-1000 delay-1000 fill-mode-both">
                <p className="text-slate-300 text-[8px] font-bold tracking-[0.3em] uppercase mb-4">{t('linktree.crafted_with_passion')}</p>
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400/60 animate-ping" />
                    <span className="text-[10px] text-slate-500 font-bold tracking-wide">© 2026 Sysmm Labs</span>
                </div>
            </div>
        </div>
    );
};

export default LinktreeView;
