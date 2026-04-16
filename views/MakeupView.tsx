import React, { useState } from 'react';
import { generateMakeupImage } from '../services/gemini';
import { saveImageToDevice } from '../lib/download';
import { useTranslation } from 'react-i18next';
import { compressImage } from '../lib/image-utils';

interface MakeupViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<boolean>;
    onResetLock?: () => void;
}

// 6种化妆风格
const MAKEUP_STYLES = [
    { id: 'natural', name: '自然裸妆', desc: '淡雅自然，突出皮肤质感', icon: '🌸' },
    { id: 'korean', name: '韩式水光妆', desc: '水润光泽，清透感十足', icon: '✨' },
    { id: 'european', name: '欧美烟熏妆', desc: '深邃立体，气场全开', icon: '🔥' },
    { id: 'sweet', name: '甜美少女妆', desc: '粉嫩可爱，减龄元气', icon: '🍬' },
    { id: 'elegant', name: '优雅名媛妆', desc: '精致高级，气质出众', icon: '👑' },
    { id: 'retro', name: '复古港风妆', desc: '浓眉红唇，经典复古', icon: '🌹' },
];

const MakeupView: React.FC<MakeupViewProps> = ({ onBack, onCheckCredits, onDeductCredit, onResetLock }) => {
    const { t } = useTranslation();
    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 1024, 0.8);
                setFaceImage(compressedBase64);
            } catch (err) {
                console.error('Image compression failed:', err);
                const reader = new FileReader();
                reader.onload = () => setFaceImage(reader.result as string);
                reader.readAsDataURL(file);
            }
        }
    };

    const handleGenerate = async () => {
        if (!faceImage || !selectedStyle) return;

        // 检查额度
        const hasCredits = await onCheckCredits?.();
        if (!hasCredits) return;

        setLoading(true);
        try {
            const style = MAKEUP_STYLES.find(s => s.id === selectedStyle);
            const result = await generateMakeupImage(faceImage, style?.name || '', style?.desc || '');
            if (result) {
                setResultImage(result);
                // 成功后扣除额度
                await onDeductCredit?.();
            } else {
                onResetLock?.();
                alert(t('common.error', '生成失败'));
            }
        } catch (e: any) {
            console.error(e);
            onResetLock?.();
            alert(`${t('common.error')}: ${e.message || 'Unknown Error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">{t('makeup.title')}</h2>
            </div>

            {/* 上传人脸照片 */}
            <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-500">{t('makeup.upload_face')}</p>
                <label className="aspect-[3/4] max-w-[200px] mx-auto rounded-2xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                    {faceImage ? (
                        <img src={faceImage} className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <span className="text-4xl">👩</span>
                            <span className="text-xs text-gray-400 mt-2 px-2 text-center">{t('makeup.upload_face_hint')}</span>
                        </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
            </div>

            {/* 选择化妆风格 */}
            <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-gray-500">{t('makeup.select_style')}</p>
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
                                <span className="font-bold text-sm">{t(`makeup.${style.id}_name`)}</span>
                            </div>
                            <p className="text-xs text-gray-500">{t(`makeup.${style.id}_desc`)}</p>
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
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('makeup.making_up')}</>
                ) : t('makeup.start')}
            </button>

            {/* 结果展示 */}
            {resultImage && (
                <div className="mt-4 flex flex-col gap-4">
                    <p className="text-center font-bold text-gray-700">{t('makeup.result_title')}</p>
                    <div className="rounded-3xl overflow-hidden shadow-xl">
                        <img src={resultImage} className="w-full" />
                    </div>
                    <button
                        onClick={() => saveImageToDevice(resultImage, 'makeup-result')}
                        className="text-pink-500 font-bold border-2 border-pink-500 rounded-xl p-3"
                    >
                        {t('makeup.save_album')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MakeupView;
