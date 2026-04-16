import ReactMarkdown from 'react-markdown';

import React, { useState } from 'react';
import { generateXHSStyleReport } from '../services/gemini';
import { useTranslation } from 'react-i18next';


interface FengShuiViewProps {
  onBack: () => void;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<boolean>;
  onResetLock?: () => void;
}

const FengShuiView: React.FC<FengShuiViewProps> = ({ onBack, onCheckCredits, onDeductCredit, onResetLock }) => {
  const [image, setImage] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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

    const hasCredits = await onCheckCredits?.();
    if (!hasCredits) return;

    setLoading(true);
    try {
      const res = await generateXHSStyleReport(t('sections.feng_shui', '居家风水'), [image], t('tests.feng_shui_prompt', '分析这张房间照片的风水布局，给出优化建议。'));
      if (res) {
        setReport(res);
        await onDeductCredit?.();
      } else {
        onResetLock?.();
        alert(t('common.error', '分析失败'));
      }
    } catch (e: any) {
      console.error(e);
      onResetLock?.();
      alert(`${t('common.error', '分析失败')}: ${e.message || 'Unknown Error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-2xl">←</button>
        <h2 className="text-xl font-bold">{t('sections.feng_shui', '家居摆设风水')}</h2>
      </div>

      <div className="mb-6">
        <label className="w-full aspect-video rounded-2xl bg-white border-2 border-dashed border-yellow-200 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm">
          {image ? (
            <img src={image} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <span className="text-4xl block mb-2">🪴</span>
              <p className="text-sm text-gray-400">{t('tests.upload_room_corner', '拍照上传办公桌或房间一角')}</p>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!image || loading}
        className="w-full h-14 bg-yellow-500 text-white rounded-2xl font-bold shadow-lg mb-6"
      >
        {loading ? t('ai.analyzing', '风水大师分析中...') : t('tests.feng_shui_btn', '开始风水诊断')}
      </button>

      {report && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-yellow-50 prose max-w-none">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default FengShuiView;
