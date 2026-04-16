import React, { useState } from 'react';
import { getApiUrl } from '../lib/api-config';
import { useTranslation } from 'react-i18next';

interface LicensePlateViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<boolean>;
    onResetLock?: () => void;
}

// 时辰对照表
const SHICHEN_MAP = [
    { name: '子时', range: '23:00-00:59', hours: [23, 0] },
    { name: '丑时', range: '01:00-02:59', hours: [1, 2] },
    { name: '寅时', range: '03:00-04:59', hours: [3, 4] },
    { name: '卯时', range: '05:00-06:59', hours: [5, 6] },
    { name: '辰时', range: '07:00-08:59', hours: [7, 8] },
    { name: '巳时', range: '09:00-10:59', hours: [9, 10] },
    { name: '午时', range: '11:00-12:59', hours: [11, 12] },
    { name: '未时', range: '13:00-14:59', hours: [13, 14] },
    { name: '申时', range: '15:00-16:59', hours: [15, 16] },
    { name: '酉时', range: '17:00-18:59', hours: [17, 18] },
    { name: '戌时', range: '19:00-20:59', hours: [19, 20] },
    { name: '亥时', range: '21:00-22:59', hours: [21, 22] },
];

// 车身颜色选项
const CAR_COLORS = [
    { name: '白色', color: '#FFFFFF', border: true },
    { name: '黑色', color: '#1a1a1a' },
    { name: '银色', color: '#C0C0C0' },
    { name: '灰色', color: '#808080' },
    { name: '红色', color: '#DC143C' },
    { name: '蓝色', color: '#1E90FF' },
    { name: '绿色', color: '#228B22' },
    { name: '黄色', color: '#FFD700' },
    { name: '橙色', color: '#FF8C00' },
    { name: '棕色', color: '#8B4513' },
    { name: '紫色', color: '#9400D3' },
    { name: '粉色', color: '#FF69B4' },
];

const LicensePlateView: React.FC<LicensePlateViewProps> = ({ onBack, onCheckCredits, onDeductCredit, onResetLock }) => {
    // 表单状态
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [shichen, setShichen] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [carColor, setCarColor] = useState('');

    // 分析状态
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    // 根据具体时间自动计算时辰
    const handleTimeChange = (time: string) => {
        setBirthTime(time);
        if (time) {
            const hour = parseInt(time.split(':')[0]);
            const matched = SHICHEN_MAP.find(s =>
                s.hours.includes(hour) || (hour === 0 && s.name === '子时')
            );
            if (matched) {
                setShichen(matched.name);
            }
        }
    };

    // 开始分析
    const handleAnalyze = async () => {
        if (!birthDate || !shichen || !licensePlate || !carColor) {
            setError(t('tests.fill_all_info', '请填写完整信息'));
            return;
        }

        // 检查额度
        const hasCredits = await onCheckCredits?.();
        if (!hasCredits) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const prompt = `你是一位精通中国传统五行命理的大师。请根据以下信息进行详细的五行车牌分析：

**个人信息：**
- 新历出生日期：${birthDate}
- 出生时辰：${shichen}
- 车牌号码：${licensePlate}
- 车身颜色：${carColor}

**请按以下步骤进行分析：**

1. **新历转农历**：将新历出生日期转换为农历日期

2. **生辰八字分析**：
   - 计算年柱、月柱、日柱、时柱
   - 分析五行分布（金木水火土各有多少）
   - 指出五行中缺什么、补什么、泄什么

3. **命主喜忌分析**：
   - 幸运数字（1-9中哪些数字有利）
   - 应避开的数字
   - 幸运颜色
   - 应避开的颜色

4. **车牌五行分析**：
   - 分析车牌号每个字符对应的五行属性
   - 数字五行：1/6属水、2/7属火、3/8属木、4/9属金、5/0属土
   - 字母五行：根据形状和笔画判断

5. **车身颜色五行**：
   - 分析${carColor}对应的五行属性
   - 是否与命主五行相合或相克

6. **综合评分**：
   - 车牌与命主匹配度（0-100分）
   - 车身颜色与命主匹配度（0-100分）
   - 总体旺主指数（0-100分）
   - 判断：旺车主还是损车主，程度如何

7. **改善建议**：
   - 如果车牌不利，给出化解方法
   - 车内可以摆放什么物品增加运势
   - 其他调整建议

请用通俗易懂的语言，使用emoji让内容更生动，用markdown格式输出。`;

            const response = await fetch(getApiUrl('/api/gemini'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'textAnalysis',
                    prompt
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || t('common.error', '分析失败'));

            setResult(data.result || data.text);

            // 成功后扣除额度
            await onDeductCredit?.();
        } catch (err: any) {
            onResetLock?.();
            alert(`${t('common.error', '分析失败')}: ${err.message || 'Unknown Error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">🚗 {t('sections.license_plate', '五行车牌')}</h2>
            </div>

            <div className="space-y-4">
                {/* 出生日期 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">📅 {t('tests.birth_date_solar', '出生日期（新历）')}</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200"
                    />
                </div>

                {/* 出生时间/时辰 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">⏰ {t('tests.birth_time', '出生时间')}</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">{t('tests.exact_time', '具体时间（可选）')}</p>
                            <input
                                type="time"
                                value={birthTime}
                                onChange={e => handleTimeChange(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">{t('tests.or_choose_shichen', '或选择时辰')}</p>
                            <select
                                value={shichen}
                                onChange={e => setShichen(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200"
                            >
                                <option value="">{t('tests.please_select', '请选择')}</option>
                                {SHICHEN_MAP.map(s => (
                                    <option key={s.name} value={s.name}>{s.name} ({s.range})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {shichen && (
                        <p className="text-xs text-cyan-600">{t('tests.selected', '已选择：')}{shichen}</p>
                    )}
                </div>

                {/* 车牌号码 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">🔢 {t('tests.license_plate_number', '车牌号码')}</label>
                    <input
                        type="text"
                        value={licensePlate}
                        onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                        placeholder={t('tests.license_plate_placeholder', '例如：粤A12345')}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 text-center text-lg font-bold tracking-widest"
                        maxLength={10}
                    />
                </div>

                {/* 车身颜色 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">🎨 {t('tests.car_color', '车身颜色')}</label>
                    <div className="grid grid-cols-6 gap-2">
                        {CAR_COLORS.map(c => (
                            <button
                                key={c.name}
                                onClick={() => setCarColor(c.name)}
                                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${carColor === c.name
                                    ? 'ring-2 ring-offset-2 ring-cyan-500 scale-110'
                                    : ''
                                    } ${c.border ? 'border border-gray-300' : ''}`}
                                style={{ backgroundColor: c.color }}
                                title={c.name}
                            />
                        ))}
                    </div>
                    {carColor && (
                        <p className="text-xs text-cyan-600 mt-2">{t('tests.selected', '已选择：')}{carColor}</p>
                    )}
                </div>

                {/* 分析按钮 */}
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50"
                >
                    {loading ? t('ai.analyzing', '正在分析中...') : `🔮 ${t('tests.start_wuxing_analysis', '开始五行分析')}`}
                </button>

                {error && (
                    <p className="text-center text-red-500">{error}</p>
                )}

                {/* 分析结果 */}
                {result && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="font-bold mb-3">📊 {t('tests.analysis_result', '分析结果')}</h3>
                        <div
                            className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>') }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LicensePlateView;
