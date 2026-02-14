
import React from 'react';
import { AppSection } from '../types';
import InstallPWA from '../components/InstallPWA';

interface HomeViewProps {
  onNavigate: (section: AppSection) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const sections = [
    { id: AppSection.TRY_ON_CLOTHES, title: 'Virtual Try-on', icon: '👗', color: 'bg-pink-100', border: 'border-pink-300' },
    { id: AppSection.TRY_ON_ACCESSORIES, title: 'Accessories', icon: '💎', color: 'bg-purple-100', border: 'border-purple-300' },
    { id: AppSection.HAIRSTYLE, title: 'Hairstyle', icon: '💇‍♀️', color: 'bg-rose-100', border: 'border-rose-300' },
    { id: AppSection.MAKEUP, title: 'AI Makeup', icon: '💄', color: 'bg-fuchsia-100', border: 'border-fuchsia-300' },
    { id: AppSection.BEAUTY_SCORE, title: 'Beauty Score', icon: '✨', color: 'bg-orange-100', border: 'border-orange-300' },
    { id: AppSection.COUPLE_FACE, title: 'Couple Face', icon: '👩‍❤️‍👨', color: 'bg-red-100', border: 'border-red-300' },
    { id: AppSection.TONGUE_DIAGNOSIS, title: 'Tongue Check', icon: '👅', color: 'bg-green-100', border: 'border-green-300' },
    { id: AppSection.FACE_COLOR, title: 'Face Glow', icon: '💆‍♀️', color: 'bg-blue-100', border: 'border-blue-300' },
    { id: AppSection.FACE_READING, title: 'Face Reading', icon: '🧿', color: 'bg-indigo-100', border: 'border-indigo-300' },
    { id: AppSection.FENG_SHUI, title: 'Feng Shui', icon: '🪑', color: 'bg-yellow-100', border: 'border-yellow-400' },
    { id: AppSection.LICENSE_PLATE, title: 'Car Plate', icon: '🚗', color: 'bg-cyan-100', border: 'border-cyan-300' },
    { id: AppSection.CALENDAR, title: 'Daily Guide', icon: '📅', color: 'bg-[#C69C6D]', border: 'border-[#A67C4D]', textColor: 'text-white' },
    { id: AppSection.MBTI_TEST, title: 'Talent Test', icon: '🧠', color: 'bg-violet-100', border: 'border-violet-300' },
    { id: AppSection.DEPRESSION_TEST, title: 'Depression', icon: '💙', color: 'bg-sky-100', border: 'border-sky-300' },
  ];

  return (
    <div className="p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl art-title mb-2">✨ Beauty Lab ✨</h1>
        <p className="text-gray-500 text-sm">✨ Discover Your Unique Charm ✨</p>
      </header>

      {/* PWA Install Button */}
      <div className="mb-6">
        <InstallPWA />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => onNavigate(sec.id)}
            className={`${sec.color} ${sec.border} border ${sec.textColor || 'text-gray-800'} rounded-2xl p-4 flex flex-row items-center justify-start gap-3 shadow-[0_4px_15px_rgba(255,107,157,0.3)] hover:shadow-[0_6px_20px_rgba(255,107,157,0.4)] transition-all transform active:scale-95 h-16`}
          >
            <span className="text-2xl flex-shrink-0">{sec.icon}</span>
            <span className="font-bold text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
              {sec.title}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-10 p-5 bg-white rounded-3xl border border-pink-100 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm">❤️</div>
          <p className="font-bold text-gray-800">Daily Tip</p>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Confidence is the best outfit! Whatever the AI says, you are a unique masterpiece in this world. Remember to stay happy every day! 🦆
        </p>
      </div>
    </div>
  );
};

export default HomeView;
