import ReactMarkdown from 'react-markdown';

import React, { useState } from 'react';
import { generateXHSStyleReport } from '../services/gemini';
import { useTranslation } from 'react-i18next';
import { compressImage } from '../lib/image-utils';


interface AnalysisViewProps {
  title: string;
  type: string;
  onBack: () => void;
  helpText?: string;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<boolean>;
  onResetLock?: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ title, type, onBack, helpText, onCheckCredits, onDeductCredit, onResetLock }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const { t } = useTranslation();
  const [gender, setGender] = useState<'女' | '男' | null>(type === '颜值打分' ? '女' : null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 1024, 0.8);
        setImage(compressedBase64);
      } catch (err) {
        console.error('Image compression failed:', err);
        // 如果压缩失败，尝试原始读取作为兜底
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    // 检查额度
    const hasCredits = await onCheckCredits?.();
    if (!hasCredits) return;

    setLoading(true);
    try {
      const res = await generateXHSStyleReport(type, [image], gender ? `性别：${gender}` : "");
      if (res) {
        setReport(res);
        // 成功后扣除额度
        console.log('[AnalysisView] 分析成功，开始扣除额度');
        await onDeductCredit?.();
      } else {
        console.warn('[AnalysisView] 分析失败，未返回结果');
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

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-2xl">←</button>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="flex flex-col gap-6">
        <label className="w-full aspect-square max-w-[280px] mx-auto rounded-3xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm">
          {image ? (
            <img src={image} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6">
              <span className="text-5xl block mb-2">📸</span>
              <p className="text-sm text-gray-400">{helpText || t('ai.upload_photo')}</p>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>

        {type === '颜值打分' && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setGender('女')}
              className={`px-6 py-2 rounded-full font-bold ${gender === '女' ? 'bg-pink-500 text-white' : 'bg-white text-gray-500'}`}
            >
              {t('ai.female')}
            </button>
            <button
              onClick={() => setGender('男')}
              className={`px-6 py-2 rounded-full font-bold ${gender === '男' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}`}
            >
              {t('ai.male')}
            </button>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="w-full h-14 xhs-gradient text-white rounded-2xl font-bold disabled:bg-gray-300 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('ai.analyzing')}</>
          ) : t('ai.start_analysis')}
        </button>

        {report && (() => {
          // 提取分数 (格式: [SCORE:XX分])
          const scoreMatch = report.match(/\[SCORE:(\d+)分?\]/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
          const cleanReport = report.replace(/\[SCORE:\d+分?\]\s*/, '');

          return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 prose prose-pink max-w-none">
              {/* 颜值打分时显示分数卡片 */}
              {type === '颜值打分' && score !== null && (
                <div className="flex flex-col items-center mb-6 -mt-2">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-white">{score}<span className="text-lg">{t('common.points_suffix', '')}</span></span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    {score >= 90 ? t('ai.beauty_evaluation.stunning') : score >= 80 ? t('ai.beauty_evaluation.excellent') : score >= 70 ? t('ai.beauty_evaluation.good') : score >= 60 ? t('ai.beauty_evaluation.fair') : t('ai.beauty_evaluation.potential')}
                  </p>
                </div>
              )}
              <ReactMarkdown>{cleanReport}</ReactMarkdown>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default AnalysisView;
