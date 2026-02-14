
import React, { useState } from 'react';
import { generateXHSStyleReport } from '../services/gemini';
import ReactMarkdown from 'https://esm.sh/react-markdown';

interface AnalysisViewProps {
  title: string;
  type: string;
  onBack: () => void;
  helpText?: string;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<void>;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ title, type, onBack, helpText, onCheckCredits, onDeductCredit }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [gender, setGender] = useState<'Female' | 'Male' | null>(type === 'Beauty Score' ? 'Female' : null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    // Check credits
    const hasCredits = await onCheckCredits?.();
    if (!hasCredits) return;

    setLoading(true);
    try {
      const res = await generateXHSStyleReport(type, [image], gender ? `Gender: ${gender}` : "");
      if (res) {
        setReport(res);
        // Deduct credit after success
        console.log('[AnalysisView] Analysis success, deducting credit');
        await onDeductCredit?.();
      } else {
        console.warn('[AnalysisView] Analysis failed, no result, credit not deducted');
        alert('Analysis encountered some issues, please try again later');
      }
    } catch (e) {
      console.error(e);
      alert('Analysis encountered some issues, please try again later');
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
              <p className="text-sm text-gray-400">{helpText || 'Upload photo to start analysis'}</p>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>

        {type === '颜值打分' && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setGender('Female')}
              className={`px-6 py-2 rounded-full font-bold ${gender === 'Female' ? 'bg-pink-500 text-white' : 'bg-white text-gray-500'}`}
            >
              Female
            </button>
            <button
              onClick={() => setGender('Male')}
              className={`px-6 py-2 rounded-full font-bold ${gender === 'Male' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}`}
            >
              Male
            </button>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="w-full h-14 xhs-gradient text-white rounded-2xl font-bold disabled:bg-gray-300 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
          ) : 'Start Analysis'}
        </button>

        {report && (() => {
          // Extract score (Format: [SCORE:XX])
          const scoreMatch = report.match(/\[SCORE:(\d+)\]/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
          const cleanReport = report.replace(/\[SCORE:\d+\]\s*/, '');

          return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 prose prose-pink max-w-none">
              {/* 颜值打分时显示分数卡片 */}
              {type === '颜值打分' && score !== null && (
                <div className="flex flex-col items-center mb-6 -mt-2">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-white">{score}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    {score >= 90 ? '✨ Stunning!' : score >= 80 ? '🌟 Gorgeous!' : score >= 70 ? '💕 Refreshing~' : score >= 60 ? '😊 Looking Good' : '💪 Hidden Gem!'}
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
