
import React, { useEffect, useState } from 'react';
import { useTranslation, Language } from '../lib/i18n';
import { API_BASE } from '../lib/config';

const ScrollingNotice: React.FC = () => {
  const { lang } = useTranslation();
  const [notice, setNotice] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getConfig' })
        });
        const data = await res.json();
        if (data.config) {
          const key = `announcement_${lang}`;
          setNotice(data.config[key] || data.config['announcement_zh'] || '');
        }
      } catch (e) {
        console.error('Failed to fetch announcement:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
    
    // 每 5 分钟刷新一次公告
    const interval = setInterval(fetchNotice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lang]);

  if (loading) return <div className="h-8" />;
  if (!notice) return null;

  return (
    <div className="w-full bg-pink-50/80 backdrop-blur-sm border-y border-pink-100 overflow-hidden py-1.5 mb-2 h-9 flex items-center shadow-sm">
      <div className="whitespace-nowrap flex animate-marquee text-pink-500 text-[13px] font-bold">
        <span className="px-4">📢 {notice}</span>
        <span className="px-4">📢 {notice}</span>
        <span className="px-4">📢 {notice}</span>
        <span className="px-4">📢 {notice}</span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          min-width: 100%;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default ScrollingNotice;
