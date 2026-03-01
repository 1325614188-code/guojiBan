
import React, { useState } from 'react';
import { useTranslation } from '../lib/i18n';

interface HairstyleViewProps {
  onBack: () => void;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<void>;
}

const HairstyleView: React.FC<HairstyleViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
  const { t } = useTranslation();
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Male hairstyle styles
  const MALE_HAIRSTYLES = [
    { id: 'pompadour', name: t('hs_pompadour'), desc: t('hs_pompadour_desc'), icon: '✈️' },
    { id: 'wolf', name: t('hs_wolf'), desc: t('hs_wolf_desc'), icon: '🐺' },
    { id: 'french', name: t('hs_french'), desc: t('hs_french_desc'), icon: '🎩' },
    { id: 'fade', name: t('hs_fade'), desc: t('hs_fade_desc'), icon: '💈' },
    { id: 'medium', name: t('hs_medium'), desc: t('hs_medium_desc'), icon: '🌊' },
    { id: 'mod', name: t('hs_mod'), desc: t('hs_mod_desc'), icon: '🎸' },
    { id: 'buzz', name: t('hs_buzz'), desc: t('hs_buzz_desc'), icon: '⚡' },
    { id: 'comma', name: t('hs_comma'), desc: t('hs_comma_desc'), icon: '🔥' },
    { id: 'sideback', name: t('hs_sideback'), desc: t('hs_sideback_desc'), icon: '👔' },
    { id: 'messy', name: t('hs_messy'), desc: t('hs_messy_desc'), icon: '😎' },
  ];

  // Female hairstyle styles
  const FEMALE_HAIRSTYLES = [
    { id: 'cub', name: t('hs_cub'), desc: t('hs_cub_desc'), icon: '🐱' },
    { id: 'butterfly', name: t('hs_butterfly'), desc: t('hs_butterfly_desc'), icon: '🦋' },
    { id: 'birkin', name: t('hs_birkin'), desc: t('hs_birkin_desc'), icon: '🇫🇷' },
    { id: 'cloudbob', name: t('hs_cloudbob'), desc: t('hs_cloudbob_desc'), icon: '☁️' },
    { id: 'collarbone', name: t('hs_collarbone'), desc: t('hs_collarbone_desc'), icon: '✨' },
    { id: 'retro90', name: t('hs_retro90'), desc: t('hs_retro90_desc'), icon: '📼' },
    { id: 'mullet', name: t('hs_mullet'), desc: t('hs_mullet_desc'), icon: '🔥' },
    { id: 'mermaid', name: t('hs_mermaid'), desc: t('hs_mermaid_desc'), icon: '🧜‍♀️' },
    { id: 'pixie', name: t('hs_pixie'), desc: t('hs_pixie_desc'), icon: '🧚' },
    { id: 'curtain', name: t('hs_curtain'), desc: t('hs_curtain_desc'), icon: '🌸' },
  ];

  const hairstyles = gender === 'Male' ? MALE_HAIRSTYLES : FEMALE_HAIRSTYLES;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFaceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!faceImage || !selectedStyle) return;

    // Check credits
    const hasCredits = await onCheckCredits?.();
    if (!hasCredits) return;

    setLoading(true);
    try {
      const style = hairstyles.find(s => s.id === selectedStyle);

      // 调用后端 API
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hairstyle',
          faceImage,
          gender,
          hairstyleName: style?.name || '',
          hairstyleDesc: style?.desc || ''
        })
      });

      const data = await response.json();
      if (data.result) {
        setResultImage(data.result);
        // Deduct credit after success
        console.log('[HairstyleView] Generation success, deducting credit');
        await onDeductCredit?.();
      } else {
        console.warn('[HairstyleView] Generation failed, no result');
        alert(t('failed'));
      }
    } catch (e) {
      console.error(e);
      alert(t('failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-2xl">←</button>
        <h2 className="text-xl font-bold">{t('hairstyle_title')}</h2>
      </div>

      {/* Upload Photo */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-gray-500">{t('step_upload_face')}</p>
        <label className="aspect-[3/4] max-w-[200px] mx-auto rounded-2xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer">
          {faceImage ? (
            <img src={faceImage} className="w-full h-full object-cover" />
          ) : (
            <>
              <span className="text-4xl">📸</span>
              <span className="text-xs text-gray-400 mt-2 px-2 text-center">{t('upload_clear_face')}</span>
            </>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Choose Gender */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-gray-500">{t('step_select_gender')}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => { setGender('Female'); setSelectedStyle(null); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${gender === 'Female' ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            👩 {t('female')}
          </button>
          <button
            onClick={() => { setGender('Male'); setSelectedStyle(null); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${gender === 'Male' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            👨 {t('male')}
          </button>
        </div>
      </div>

      {/* Select Hairstyle Style */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500">{t('step_select_style')}</p>
        <div className="grid grid-cols-2 gap-3">
          {hairstyles.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${selectedStyle === style.id
                ? 'border-rose-500 bg-rose-50'
                : 'border-gray-200 bg-white hover:border-rose-300'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{style.icon}</span>
                <span className="font-bold text-xs">{style.name}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{style.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={!faceImage || !selectedStyle || loading}
        className="w-full h-14 bg-rose-500 text-white rounded-2xl font-bold disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('processing')}</>
        ) : t('generate_hairstyle')}
      </button>

      {/* 结果展示 */}
      {resultImage && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-center font-bold text-gray-700">{t('hairstyle_result_tip')}</p>
          <div className="rounded-3xl overflow-hidden shadow-xl">
            <img src={resultImage} className="w-full" />
          </div>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = resultImage;
              link.download = 'hairstyle-result.png';
              link.click();
            }}
            className="text-rose-500 font-bold border-2 border-rose-500 rounded-xl p-3"
          >
            {t('save_to_album')}
          </button>
        </div>
      )}
    </div>
  );
};

export default HairstyleView;
