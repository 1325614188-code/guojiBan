import ReactMarkdown from 'react-markdown';

import React, { useState } from 'react';
import { generateXHSStyleReport } from '../services/gemini';
import { useTranslation } from 'react-i18next';
import { compressImage } from '../lib/image-utils';


interface CoupleFaceViewProps {
  onBack: () => void;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<boolean>;
  onResetLock?: () => void;
}

const CoupleFaceView: React.FC<CoupleFaceViewProps> = ({ onBack, onCheckCredits, onDeductCredit, onResetLock }) => {
  const [maleImg, setMaleImg] = useState<string | null>(null);
  const [femaleImg, setFemaleImg] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 1024, 0.8);
        setter(compressedBase64);
      } catch (err) {
        console.error('Image compression failed:', err);
        const reader = new FileReader();
        reader.onload = () => setter(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!maleImg || !femaleImg) return;

    // 检查额度
    const hasCredits = await onCheckCredits?.();
    if (!hasCredits) return;

    setLoading(true);
    try {
      const res = await generateXHSStyleReport(t('sections.couple_face', "夫妻相分析"), [maleImg, femaleImg], t('tests.couple_face_prompt', "分析这两张脸的五官特征是否契合，给出夫妻相打分和情感建议。"));
      if (res) {
        setReport(res);
        // 成功后扣除额度
        console.log('[CoupleFaceView] 分析成功，开始扣除额度');
        await onDeductCredit?.();
      } else {
        onResetLock?.();
        alert(t('common.error', '分析失败'));
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
        <h2 className="text-xl font-bold">{t('sections.couple_face', '夫妻相实验室')}</h2>
      </div>

      <div className="flex gap-4 mb-6">
        <label className="flex-1 aspect-square rounded-2xl bg-white border-2 border-dashed border-blue-100 flex items-center justify-center overflow-hidden cursor-pointer">
          {maleImg ? <img src={maleImg} className="w-full h-full object-cover" /> : <div className="text-center"><span className="text-3xl block">👨</span><span className="text-[10px] text-gray-400">{t('tests.male_photo', '男方照片')}</span></div>}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setMaleImg)} />
        </label>
        <div className="flex items-center text-red-400 text-2xl font-bold">❤️</div>
        <label className="flex-1 aspect-square rounded-2xl bg-white border-2 border-dashed border-pink-100 flex items-center justify-center overflow-hidden cursor-pointer">
          {femaleImg ? <img src={femaleImg} className="w-full h-full object-cover" /> : <div className="text-center"><span className="text-3xl block">👩</span><span className="text-[10px] text-gray-400">{t('tests.female_photo', '女方照片')}</span></div>}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setFemaleImg)} />
        </label>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!maleImg || !femaleImg || loading}
        className="w-full h-14 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-2xl font-bold disabled:bg-gray-300 shadow-lg mb-6"
      >
        {loading ? t('ai.analyzing', 'AI月老计算中...') : t('tests.couple_face_btn', '测测我们的夫妻相')}
      </button>

      {report && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-50 prose prose-pink max-w-none">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default CoupleFaceView;
