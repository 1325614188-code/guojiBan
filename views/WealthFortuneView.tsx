
import React, { useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { generateXHSStyleReport } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface WealthFortuneViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<void>;
}

const WealthFortuneView: React.FC<WealthFortuneViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
    const { t, lang } = useTranslation();
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female'>('Female');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);

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
        2. Based on Chinese Bazi (Eight Characters) and current/upcoming annual transits (flu years), predict the years with the best wealth luck.
        3. Recommend suitable industries or career paths based on the five elements (Wu Xing) balance.
        Style: Encouraging, detailed, and professional wealth advisor style.
      `;

            const res = await generateXHSStyleReport("Wealth & Bazi Analysis", [], prompt, lang);

            if (res) {
                setReport(res);
                // Deduct credit
                await onDeductCredit?.();
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
                <h2 className="text-xl font-bold">{t('wealth_fortune')}</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-50 flex flex-col gap-4 mb-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('birth_date')}</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('birth_time')}</label>
                    <input
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('gender')}</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setGender('Female')}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${gender === 'Female' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-50 text-gray-500'}`}
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
            </div>

            <button
                onClick={handleAnalyze}
                disabled={!birthDate || loading}
                className="w-full h-14 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('start_prediction')}
            </button>

            {report && (
                <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-amber-50 prose max-w-none">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default WealthFortuneView;
