
import React, { useState } from 'react';

interface HairstyleViewProps {
  onBack: () => void;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<void>;
}

// Male hairstyle styles
const MALE_HAIRSTYLES = [
  { id: 'pompadour', name: 'Modern Pompadour', desc: 'A modern twist on the classic pompadour, using matte clay for natural volume', icon: '✈️' },
  { id: 'wolf', name: 'Soft Wolf Cut', desc: 'Shortened back length, perfect for commuting, highlights youthful energy', icon: '🐺' },
  { id: 'french', name: 'Classic Quiff', desc: 'Classic back-combed style, polished and neat, gentleman retro vibe', icon: '🎩' },
  { id: 'fade', name: 'Skin Fade', desc: 'Gradient around the ears in a semi-circle, strong structure', icon: '💈' },
  { id: 'medium', name: 'Flowy Mid-length', desc: 'Artistic long messy hair, slightly curled at the ends, lazy and high-end', icon: '🌊' },
  { id: 'mod', name: 'Modern British Mod', desc: 'Rich layers, forehead-covering bangs, rebellious rock vibe', icon: '🎸' },
  { id: 'buzz', name: 'High Skin Fade Buzz', desc: 'Thoroughly skin-faded sides with clean geometric lines', icon: '⚡' },
  { id: 'comma', name: 'Comma Hair', desc: 'Bangs curved inward like a comma, highlighting facial features', icon: '🔥' },
  { id: 'sideback', name: 'Side Part Slick Back', desc: 'Modern side part, maintaining natural shine, polished and professional', icon: '👔' },
  { id: 'messy', name: 'Messy Textured Crop', desc: 'Covering the forehead, messy layers, natural age-reducing effect', icon: '😎' },
];

// Female hairstyle styles
const FEMALE_HAIRSTYLES = [
  { id: 'cub', name: 'Soft Cub Cut', desc: 'Short hair with soft curls, playful and cute', icon: '🐱' },
  { id: 'butterfly', name: 'Butterfly Cut', desc: 'Distinct layers, fluffy and natural, romantic and soul-lifting', icon: '🦋' },
  { id: 'birkin', name: 'Birkin Bangs', desc: 'Airy bangs, French effortless elegance', icon: '🇫🇷' },
  { id: 'cloudbob', name: 'Cloud Bob', desc: 'Fluffy and full short hair, sweet and gentle', icon: '☁️' },
  { id: 'collarbone', name: 'Collarbone Blunt Cut', desc: 'Shoulder-length, capable and intellectual', icon: '✨' },
  { id: 'retro90', name: '90s Retro Layers', desc: 'Vintage layers, classic Hong Kong style vibe', icon: '📼' },
  { id: 'mullet', name: 'Modern Mullet', desc: 'Short front and long back, bold and individualistic', icon: '🔥' },
  { id: 'mermaid', name: 'Mermaid Cut', desc: 'Long wavy hair, ethereal and fairy-like', icon: '🧜‍♀️' },
  { id: 'pixie', name: 'Soft Pixie Cut', desc: 'Extra short face-framing, clean and crisp', icon: '🧚' },
  { id: 'curtain', name: 'Curtain Bangs Shag', desc: 'Side-swept bangs for a smaller face, gentle and sweet', icon: '🌸' },
];

const HairstyleView: React.FC<HairstyleViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        alert('Generation failed, please try again later');
      }
    } catch (e) {
      console.error(e);
      alert('Generation failed, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-2xl">←</button>
        <h2 className="text-xl font-bold">Hairstyle Reference</h2>
      </div>

      {/* Upload Photo */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-gray-500">1. Upload a front face photo</p>
        <label className="aspect-[3/4] max-w-[200px] mx-auto rounded-2xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer">
          {faceImage ? (
            <img src={faceImage} className="w-full h-full object-cover" />
          ) : (
            <>
              <span className="text-4xl">📸</span>
              <span className="text-xs text-gray-400 mt-2 px-2 text-center">Please upload a clear front face photo</span>
            </>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Choose Gender */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-gray-500">2. Select Gender</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => { setGender('Female'); setSelectedStyle(null); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${gender === 'Female' ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            👩 Female
          </button>
          <button
            onClick={() => { setGender('Male'); setSelectedStyle(null); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${gender === 'Male' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            👨 Male
          </button>
        </div>
      </div>

      {/* Select Hairstyle Style */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500">3. Select Hairstyle Style</p>
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
          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
        ) : 'Generate Hairstyle 💇'}
      </button>

      {/* 结果展示 */}
      {resultImage && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-center font-bold text-gray-700">💇 Here is your hairstyle result:</p>
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
            Save to Album
          </button>
        </div>
      )}
    </div>
  );
};

export default HairstyleView;
