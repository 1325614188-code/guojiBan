import React, { useState, useEffect, useRef } from 'react';
import { Solar } from 'lunar-javascript';
import { analysisMarriage, generatePartnerImage } from '../services/gemini';
import { useTranslation } from 'react-i18next';
import { compressImage } from '../lib/image-utils';

interface MarriageViewProps {
    onBack: () => void;
    onCheckCredits: () => Promise<boolean>;
    onDeductCredit: () => Promise<boolean>;
    onResetLock?: () => void;
}

const MarriageView: React.FC<MarriageViewProps> = ({ onBack, onCheckCredits, onDeductCredit, onResetLock }) => {
    // 日期选择状态
    const date = new Date();
    const [year, setYear] = useState(date.getFullYear() - 25);
    const [month, setMonth] = useState(date.getMonth() + 1);
    const [day, setDay] = useState(date.getDate());
    const [hour, setHour] = useState(12);
    const [lunarText, setLunarText] = useState('');

    const [gender, setGender] = useState<'男' | '女'>('女');
    const [usePhoto, setUsePhoto] = useState(false);
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [generatingPartner, setGeneratingPartner] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [partnerImage, setPartnerImage] = useState<string | null>(null);
    const { t } = useTranslation();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 计算农历
    useEffect(() => {
        try {
            const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
            const lunar = solar.getLunar();
            const shiChen = lunar.getTimeZhi() + t('tests.shi_chen_suffix', '时');
            setLunarText(`${t('tests.lunar', '农历：')}${lunar.getYearInGanZhi()}${t('common.year')} ${lunar.getMonthInChinese()}${t('common.month')} ${lunar.getDayInChinese()} ${shiChen}`);
        } catch (e) {
            setLunarText(t('tests.invalid_date', '日期无效'));
        }
    }, [year, month, day, hour]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 1024, 0.8);
                setUserPhoto(compressedBase64);
            } catch (err) {
                console.error('Image compression failed:', err);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setUserPhoto(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleAnalyze = async () => {
        const birthInfo = `${year}年${month}月${day}日 ${hour}:00`;

        // 检查额度
        const hasCredits = await onCheckCredits();
        if (!hasCredits) return;

        setLoading(true);
        try {
            const report = await analysisMarriage(birthInfo, gender);
            if (report) {
                setResult(report);
                await onDeductCredit();
            } else {
                onResetLock?.();
                alert(t('common.error', '分析失败，请稍后重试'));
            }
        } catch (e: any) {
            console.error(e);
            onResetLock?.();
            alert(`${t('common.error', '分析失败')}: ${e.message || 'Unknown Error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePartnerImage = async () => {
        if (!userPhoto) {
            alert(t('tests.upload_photo_for_partner', '请上传一张您的正面照片，以便 AI 生成更契合的另一半哦～'));
            return;
        }

        const hasExtraCredit = await onCheckCredits();
        if (!hasExtraCredit) return;

        setGeneratingPartner(true);
        try {
            // 提取 PARTNER_DESC
            const descMatch = result?.match(/\[PARTNER_DESC:(.*?)\]/);
            const partnerDesc = descMatch ? descMatch[1] : '一位理想的中国异性';
            const image = await generatePartnerImage(partnerDesc, gender, userPhoto);
            
            if (image) {
                setPartnerImage(image);
                await onDeductCredit();
            } else {
                onResetLock?.();
                alert(t('common.error', '生成失败，请稍后重试'));
            }
        } catch (e: any) {
            console.error(e);
            onResetLock?.();
            alert(`${t('common.error', '生成失败')}: ${e.message || 'Unknown Error'}`);
        } finally {
            setGeneratingPartner(false);
        }
    };

    if (result) {
        return (
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-2xl">←</button>
                    <h2 className="text-xl font-bold">{t('tests.marriage_result', '姻缘分析结果')}</h2>
                </div>

                {partnerImage && (
                    <div className="bg-white rounded-3xl overflow-hidden shadow-lg border-4 border-pink-200">
                        <img src={partnerImage} alt={t('tests.ideal_partner', '理想另一半')} className="w-full h-80 object-cover" />
                        <div className="p-3 bg-pink-50 text-center text-pink-600 font-bold text-sm">
                            {t('tests.ai_generated_partner', '✨ AI 根据您的相貌与命理生成的“天定良缘” ✨')}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 xhs-report">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                        {result.replace(/\[PARTNER_DESC:.*?\]/, '').trim()}
                    </div>
                </div>

                <button onClick={onBack} className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-2xl font-bold shadow-lg">
                    {t('common.back')}
                </button>
            </div>
        );
    }

    // 生成选项
    const years = Array.from({ length: 100 }, (_, i) => 2024 - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="p-6 flex flex-col gap-6 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">{t('sections.marriage_analysis')}</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 flex flex-col gap-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">{t('ai.birth_info')}</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-pink-50 bg-pink-50/20 text-sm focus:outline-none"
                        >
                            {years.map(y => <option key={y} value={y}>{y}{t('common.year')}</option>)}
                        </select>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-pink-50 bg-pink-50/20 text-sm focus:outline-none"
                        >
                            {months.map(m => <option key={m} value={m}>{m}{t('common.month')}</option>)}
                        </select>
                        <select
                            value={day}
                            onChange={(e) => setDay(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-pink-50 bg-pink-50/20 text-sm focus:outline-none"
                        >
                            {days.map(d => <option key={d} value={d}>{d}{t('common.day')}</option>)}
                        </select>
                        <select
                            value={hour}
                            onChange={(e) => setHour(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-pink-50 bg-pink-50/20 text-sm focus:outline-none"
                        >
                            {hours.map(h => <option key={h} value={h}>{h}{t('common.hour')}</option>)}
                        </select>
                    </div>
                    <p className="text-[10px] text-pink-400 font-medium px-1">{lunarText}</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('member.gender') || '您的性别'}</label>
                    <div className="flex gap-4">
                        {(['女', '男'] as const).map(g => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className={`flex-1 h-12 rounded-xl font-bold transition-all ${gender === g ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                            >
                                {g === '女' ? '🚺 ' + t('ai.female') : '🚹 ' + t('ai.male')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-pink-100/50">
                    <span className="text-sm font-bold text-rose-700">{t('tests.generate_partner_image', '生成理想另一半画像')}</span>
                    <button
                        onClick={() => setUsePhoto(!usePhoto)}
                        className={`w-12 h-6 rounded-full transition-all relative ${usePhoto ? 'bg-pink-500' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${usePhoto ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {usePhoto && (
                    <div className="bg-pink-50/50 p-4 rounded-2xl border border-dashed border-pink-200">
                        <p className="text-xs text-pink-600 mb-3 text-center">{t('tests.upload_photo_precise', '上传您的正面照，匹配更精准')}</p>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 mx-auto bg-white rounded-2xl border-2 border-pink-100 flex items-center justify-center cursor-pointer overflow-hidden shadow-inner"
                        >
                            {userPhoto ? (
                                <img src={userPhoto} alt="本人" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">📷</span>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <p className="text-[9px] text-pink-400 text-center mt-3">{t('tests.photo_credit_hint', '提示：生成画像将额外消耗1次额度')}</p>
                    </div>
                )}

                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-2xl font-bold mt-2 shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? t('ai.analyzing_destiny', '🔮 正在窥探天机...') : t('tests.start_marriage_journey', '开启姻缘之旅 ✨')}
                </button>
            </div>

            <div className="mt-4 p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border border-pink-100">
                <h4 className="font-bold text-pink-700 mb-2 flex items-center gap-2">
                    <span>📜</span> {t('tests.principle_explanation', '原理说明')}
                </h4>
                <p className="text-xs text-pink-600 leading-relaxed">
                    {t('tests.marriage_principle_desc', '本功能结合中国传统八字命理精髓与现代 AI 大模型，精准换算农历并分析五行生克。我们将为您解析正缘出现的绝佳时机，并基于相术原理为您勾勒出命中注定的 Ta。')}
                </p>
            </div>
        </div>
    );
};

export default MarriageView;
