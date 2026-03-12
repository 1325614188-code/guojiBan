
import React, { useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { generateXHSStyleReport } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface LoveFortuneViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<boolean>;
}

const LoveFortuneView: React.FC<LoveFortuneViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
    const { t, lang } = useTranslation();
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female'>('Female');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!birthDate) return;

        // Check credits
        const hasCredits = await onCheckCredits?.();
        if (!hasCredits) return;

        setLoading(true);
        try {
            const prompt = `
        User Birth Date (Solar): ${birthDate}
        User Birth Time: ${birthTime || 'Unknown'}
        User Gender: ${gender}
        Task: 
        1. Convert Solar date to Lunar date.
        2. Based on Chinese Bazi (Eight Characters) and current/upcoming annual transits (flu years), predict the years with the highest probability of meeting a significant other.
        3. Describe the characteristics of this partner (approximate age, personality, physical features).
        ${image ? "4. Based on the uploaded face photo and traditional physiognomy (Xiangshu), describe the ideal partner's appearance in detail." : ""}
        Style: Professional yet engaging, like a traditional fortune teller combined with modern lifestyle coaching.
      `;

            const res = await generateXHSStyleReport("Love Destiny & Bazi Analysis", image ? [image] : [], prompt, lang);

            if (res) {
                setReport(res);
                // Deduct credit
                await onDeductCredit?.();
                // If image was uploaded, deduct an extra credit as requested
                if (image) {
                    console.log('[LoveFortune] Image uploaded, deducting extra credit');
                    await onDeductCredit?.();
                }
            } else {
                alert(t('failed'));
            }
        } catch (e) {
            console.error(e);
            alert(t('error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">{t('love_fortune')}</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 flex flex-col gap-4 mb-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('birth_date')}</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('birth_time')}</label>
                    <input
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('gender')}</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setGender('Female')}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${gender === 'Female' ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-50 text-gray-500'}`}
                        >
                            {t('female')}
                        </button>
                        <button
                            onClick={() => setGender('Male')}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${gender === 'Male' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-50 text-gray-500'}`}
                        >
                            {t('male')}
                        </button>
                    </div>
                </div>

                <div className="mt-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('upload_photo')}</label>
                    <label className="w-full aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                        {image ? (
                            <img src={image} className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <span className="text-3xl mb-1">🤳</span>
                                <span className="text-xs text-gray-400 text-center px-4">{t('photo_extra_quota')}</span>
                            </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            <button
                onClick={handleAnalyze}
                disabled={!birthDate || loading}
                className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('start_prediction')}
            </button>

            {report && (
                <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-pink-50 prose prose-pink max-w-none">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default LoveFortuneView;
