import React, { useState } from 'react';

interface LicensePlateViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<void>;
}

// 时辰对照表
// ... (rest of constants stay the same)

const LicensePlateView: React.FC<LicensePlateViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
    // ... (state stays the same)

    // 开始分析
    const handleAnalyze = async () => {
        if (!birthDate || !shichen || !licensePlate || !carColor) {
            setError('请填写完整信息');
            return;
        }

        // 检查额度
        const hasCredits = await onCheckCredits?.();
        if (!hasCredits) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const prompt = `...`; // (prompt stays same)

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'textAnalysis',
                    prompt
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '分析失败');

            setResult(data.result || data.text);

            // 成功后扣除额度
            await onDeductCredit?.();
        } catch (err: any) {
            setError(err.message || '分析失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">🚗 五行车牌</h2>
            </div>

            <div className="space-y-4">
                {/* 出生日期 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">📅 出生日期（新历）</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200"
                    />
                </div>

                {/* 出生时间/时辰 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">⏰ 出生时间</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">具体时间（可选）</p>
                            <input
                                type="time"
                                value={birthTime}
                                onChange={e => handleTimeChange(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">或选择时辰</p>
                            <select
                                value={shichen}
                                onChange={e => setShichen(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200"
                            >
                                <option value="">请选择</option>
                                {SHICHEN_MAP.map(s => (
                                    <option key={s.name} value={s.name}>{s.name} ({s.range})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {shichen && (
                        <p className="text-xs text-cyan-600">已选择：{shichen}</p>
                    )}
                </div>

                {/* 车牌号码 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">🔢 车牌号码</label>
                    <input
                        type="text"
                        value={licensePlate}
                        onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                        placeholder="例如：粤A12345"
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 text-center text-lg font-bold tracking-widest"
                        maxLength={10}
                    />
                </div>

                {/* 车身颜色 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">🎨 车身颜色</label>
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
                        <p className="text-xs text-cyan-600 mt-2">已选择：{carColor}</p>
                    )}
                </div>

                {/* 分析按钮 */}
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50"
                >
                    {loading ? '正在分析中...' : '🔮 开始五行分析'}
                </button>

                {error && (
                    <p className="text-center text-red-500">{error}</p>
                )}

                {/* 分析结果 */}
                {result && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="font-bold mb-3">📊 分析结果</h3>
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
