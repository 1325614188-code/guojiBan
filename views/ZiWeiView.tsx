import React, { useState, useEffect } from 'react';
import { Solar } from 'lunar-javascript';
import { analysisZiWei } from '../services/gemini';
import { useTranslation } from 'react-i18next';

interface ZiWeiViewProps {
    onBack: () => void;
    onCheckCredits: () => Promise<boolean>;
    onDeductCredit: () => Promise<boolean>;
    onResetLock?: () => void;
}

const ZiWeiView: React.FC<ZiWeiViewProps> = ({ onBack, onCheckCredits, onDeductCredit, onResetLock }) => {
    // 日期选择状态
    const date = new Date();
    const [year, setYear] = useState(date.getFullYear() - 30);
    const [month, setMonth] = useState(date.getMonth() + 1);
    const [day, setDay] = useState(date.getDate());
    const [hour, setHour] = useState(12);
    const [lunarText, setLunarText] = useState('');
    const [baziText, setBaziText] = useState('');

    const [gender, setGender] = useState<'男' | '女'>('女');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const { t } = useTranslation();

    // 计算农历和八字
    useEffect(() => {
        try {
            const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
            const lunar = solar.getLunar();
            const shiChen = lunar.getTimeZhi() + t('tests.shi_chen_suffix', '时');
            
            setLunarText(`${t('tests.lunar', '农历：')}${lunar.getYearInGanZhi()}${t('common.year')} ${lunar.getMonthInChinese()}${t('common.month')} ${lunar.getDayInChinese()} ${shiChen}`);
            
            // 八字：年干支 月干支 日干支 时干支
            const bazi = `${lunar.getYearInGanZhi()} ${lunar.getMonthInGanZhi()} ${lunar.getDayInGanZhi()} ${lunar.getTimeInGanZhi()}`;
            setBaziText(bazi);
        } catch (e) {
            setLunarText(t('tests.invalid_date', '日期无效'));
            setBaziText('');
        }
    }, [year, month, day, hour, t]);

    const handleAnalyze = async () => {
        const birthInfo = `${year}年${month}月${day}日 ${hour}:00 (八字: ${baziText})`;

        const hasCredits = await onCheckCredits();
        if (!hasCredits) return;

        setLoading(true);
        try {
            const report = await analysisZiWei(birthInfo, gender);
            if (report) {
                setResult(report);
                await onDeductCredit();
            } else {
                onResetLock?.();
                alert(t('common.error', '生成报告失败，请稍后重试'));
            }
        } catch (e: any) {
            console.error(e);
            onResetLock?.();
            alert(`${t('common.error')}: ${e.message || 'Unknown Error'}`);
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-2xl">←</button>
                    <h2 className="text-xl font-bold">{t('tests.zi_wei_report', '紫微命盘深度解析')}</h2>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 xhs-report">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                        {result}
                    </div>
                </div>

                <button onClick={onBack} className="w-full h-14 bg-gradient-to-r from-indigo-400 to-purple-500 text-white rounded-2xl font-bold shadow-lg">
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
                <h2 className="text-xl font-bold">{t('sections.zi_wei_dou_shu')}</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 flex flex-col gap-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">{t('ai.birth_info')}</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-indigo-50 bg-indigo-50/20 text-sm focus:outline-none"
                        >
                            {years.map(y => <option key={y} value={y}>{y}{t('common.year')}</option>)}
                        </select>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-indigo-50 bg-indigo-50/20 text-sm focus:outline-none"
                        >
                            {months.map(m => <option key={m} value={m}>{m}{t('common.month')}</option>)}
                        </select>
                        <select
                            value={day}
                            onChange={(e) => setDay(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-indigo-50 bg-indigo-50/20 text-sm focus:outline-none"
                        >
                            {days.map(d => <option key={d} value={d}>{d}{t('common.day')}</option>)}
                        </select>
                        <select
                            value={hour}
                            onChange={(e) => setHour(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-indigo-50 bg-indigo-50/20 text-sm focus:outline-none"
                        >
                            {hours.map(h => <option key={h} value={h}>{h}{t('common.hour')}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                        <p className="text-[10px] text-indigo-500 font-medium">{lunarText}</p>
                        {baziText && <p className="text-[10px] text-purple-500 font-bold">八字：{baziText}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('member.gender')}</label>
                    <div className="flex gap-4">
                        {(['女', '男'] as const).map(g => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className={`flex-1 h-12 rounded-xl font-bold transition-all ${gender === g ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                            >
                                {g === '女' ? '🚺 ' + t('ai.female') : '🚹 ' + t('ai.male')}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-indigo-400 to-purple-500 text-white rounded-2xl font-bold mt-2 shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? t('ai.analyzing_zi_wei') : t('tests.start_zi_wei_journey')}
                </button>
            </div>

            <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100">
                <h4 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
                    <span>🌌</span> {t('tests.principle_explanation')}
                </h4>
                <p className="text-xs text-indigo-600 leading-relaxed">
                    {t('tests.zi_wei_principle_desc')}
                </p>
            </div>
        </div>
    );
};

export default ZiWeiView;
