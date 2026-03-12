
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

  if (loading || !notice) return <div className="h-8" />;

  return (
    <div className="w-full bg-pink-50/50 border-y border-pink-100 overflow-hidden py-1 mb-4 h-8 flex items-center">
      <div className="whitespace-nowrap inline-block animate-marquee text-pink-600 text-sm font-medium">
        {notice}
        <span className="mx-16">{notice}</span>
        <span className="mx-16">{notice}</span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default ScrollingNotice;
