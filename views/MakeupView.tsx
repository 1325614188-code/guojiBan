
import React, { useState } from 'react';
import { generateMakeupImage } from '../services/gemini';

interface MakeupViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<void>;
}

// 6 makeup styles
const MAKEUP_STYLES = [
    { id: 'natural', name: 'Natural Nude', desc: 'Elegant and natural, highlighting skin texture', icon: '🌸' },
    { id: 'korean', name: 'Korean Dewy', desc: 'Moisturized glow, full of clarity', icon: '✨' },
    { id: 'european', name: 'Western Smoky', desc: 'Deep and three-dimensional, powerful aura', icon: '🔥' },
    { id: 'sweet', name: 'Sweet Girl', desc: 'Pink and cute, youthful energy', icon: '🍬' },
    { id: 'elegant', name: 'Elegant Socialite', desc: 'Exquisite and high-end, outstanding temperament', icon: '👑' },
    { id: 'retro', name: 'Retro HK Style', desc: 'Bold brows and red lips, classic retro', icon: '🌹' },
];

const MakeupView: React.FC<MakeupViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
            const style = MAKEUP_STYLES.find(s => s.id === selectedStyle);
            const result = await generateMakeupImage(faceImage, style?.name || '', style?.desc || '');
            if (result) {
                setResultImage(result);
                // Deduct credit after success
                console.log('[MakeupView] Generation success, deducting credit');
                await onDeductCredit?.();
            } else {
                console.warn('[MakeupView] Generation failed, no result, credit not deducted');
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
                <h2 className="text-xl font-bold">Makeup Effect</h2>
            </div>

            {/* Upload Face Photo */}
            <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-500">1. Upload a front face photo</p>
                <label className="aspect-[3/4] max-w-[200px] mx-auto rounded-2xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                    {faceImage ? (
                        <img src={faceImage} className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <span className="text-4xl">👩</span>
                            <span className="text-xs text-gray-400 mt-2 px-2 text-center">Please upload a clear front face photo</span>
                        </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
            </div>

            {/* Select Makeup Style */}
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-gray-500">2. Select Makeup Style</p>
                <div className="grid grid-cols-2 gap-3">
                    {MAKEUP_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`p-3 rounded-xl border-2 transition-all text-left ${selectedStyle === style.id
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 bg-white hover:border-pink-300'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{style.icon}</span>
                                <span className="font-bold text-sm">{style.name}</span>
                            </div>
                            <p className="text-xs text-gray-500">{style.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* 生成按钮 */}
            <button
                onClick={handleGenerate}
                disabled={!faceImage || !selectedStyle || loading}
                className="w-full h-14 bg-pink-500 text-white rounded-2xl font-bold disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
            >
                {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                ) : 'Start Magic Makeup 💄'}
            </button>

            {/* 结果展示 */}
            {resultImage && (
                <div className="mt-4 flex flex-col gap-4">
                    <p className="text-center font-bold text-gray-700">✨ Here is your makeup result:</p>
                    <div className="rounded-3xl overflow-hidden shadow-xl">
                        <img src={resultImage} className="w-full" />
                    </div>
                    <button
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = resultImage;
                            link.download = 'makeup-result.png';
                            link.click();
                        }}
                        className="text-pink-500 font-bold border-2 border-pink-500 rounded-xl p-3"
                    >
                        Save to Album
                    </button>
                </div>
            )}
        </div>
    );
};

export default MakeupView;
