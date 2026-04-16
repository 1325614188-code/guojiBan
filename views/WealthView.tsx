
import React, { useState, useEffect } from 'react';
import { Solar } from 'lunar-javascript';
import { analysisWealth } from '../services/gemini';
import { useTranslation } from 'react-i18next';

interface WealthViewProps {
    onBack: () => void;
    onCheckCredits: () => Promise<boolean>;
    onDeductCredit: () => Promise<boolean>;
    onResetLock?: () => void;
}

const WealthView: React.FC<WealthViewProps> = ({ onBack, onCheckCredits, onDeductCredit, onResetLock }) => {
    // 日期选择状态
    const date = new Date();
    const [year, setYear] = useState(date.getFullYear() - 30);
    const [month, setMonth] = useState(date.getMonth() + 1);
    const [day, setDay] = useState(date.getDate());
    const [hour, setHour] = useState(12);
    const [lunarText, setLunarText] = useState('');

    const [gender, setGender] = useState<'男' | '女'>('女');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const { t } = useTranslation();

    // 计算农历
    useEffect(() => {
        try {
            const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
            const lunar = solar.getLunar();
            const shiChen = lunar.getTimeZhi() + '时';
            setLunarText(`农历：${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()} ${shiChen}`);
        } catch (e) {
            setLunarText('日期无效');
        }
    }, [year, month, day, hour]);

    const handleAnalyze = async () => {
        const birthInfo = `${year}年${month}月${day}日 ${hour}:00`;

        const hasCredits = await onCheckCredits();
        if (!hasCredits) return;

        setLoading(true);
        try {
            const report = await analysisWealth(birthInfo, gender);
            if (report) {
                setResult(report);
                await onDeductCredit();
            } else {
                onResetLock?.();
                alert(t('common.error'));
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
                    <h2 className="text-xl font-bold">{t('tests.wealth_report', '财运报告')}</h2>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 xhs-report">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                        {result}
                    </div>
                </div>

                <button onClick={onBack} className="w-full h-14 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-bold shadow-lg">
                    {t('tests.keep_making_money', '继续搞钱 💰')}
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
                <h2 className="text-xl font-bold">{t('sections.wealth_analysis', '看财富')}</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 flex flex-col gap-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">{t('tests.birth_info_solar', '出生信息 (新历)')}</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-amber-50 bg-amber-50/20 text-sm focus:outline-none"
                        >
                            {years.map(y => <option key={y} value={y}>{y}{t('common.year')}</option>)}
                        </select>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-amber-50 bg-amber-50/20 text-sm focus:outline-none"
                        >
                            {months.map(m => <option key={m} value={m}>{m}{t('common.month')}</option>)}
                        </select>
                        <select
                            value={day}
                            onChange={(e) => setDay(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-amber-50 bg-amber-50/20 text-sm focus:outline-none"
                        >
                            {days.map(d => <option key={d} value={d}>{d}{t('common.day')}</option>)}
                        </select>
                        <select
                            value={hour}
                            onChange={(e) => setHour(parseInt(e.target.value))}
                            className="h-11 px-3 rounded-xl border border-amber-50 bg-amber-50/20 text-sm focus:outline-none"
                        >
                            {hours.map(h => <option key={h} value={h}>{h}{t('common.hour')}</option>)}
                        </select>
                    </div>
                    <p className="text-[10px] text-amber-500 font-medium px-1">{lunarText}</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('member.gender', '您的性别')}</label>
                    <div className="flex gap-4">
                        {(['女', '男'] as const).map(g => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className={`flex-1 h-12 rounded-xl font-bold transition-all ${gender === g ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                            >
                                {g === '女' ? '🚺 ' + t('ai.female') : '🚹 ' + t('ai.male')}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-bold mt-2 shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? t('ai.analyzing_wealth', '🪙 正在财位推算...') : t('tests.predict_wealth', '预测财富未来 💰')}
                </button>
            </div>

            <div className="mt-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100">
                <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                    <span>🪙</span> {t('tests.wealth_guide_principle', '搞钱指南原理')}
                </h4>
                <p className="text-xs text-amber-600 leading-relaxed">
                    {t('tests.wealth_guide_desc', '基于生辰八字中的财星旺衰、十神分布，结合流年财位走向，利用 AI 技术为您解析一生的财富脉络。不仅提供财旺年份预测，更结合您的命理五行给出具体的转行建议和旺财局。')}
                </p>
            </div>
        </div>
    );
};

export default WealthView;
