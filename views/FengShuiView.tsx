
import React, { useState } from 'react';
import { generateXHSStyleReport } from '../services/gemini';
import ReactMarkdown from 'https://esm.sh/react-markdown';

interface FengShuiViewProps {
  onBack: () => void;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<void>;
}

const FengShuiView: React.FC<FengShuiViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
  const [image, setImage] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const res = await generateXHSStyleReport("Feng Shui Analysis", [image], "Analyze the layout of the desk or home furniture in the photo, provide a Feng Shui score, and give improvement suggestions. ALL content must be in English.");
      if (res) {
        setReport(res);
        // Deduct credit after success
        console.log('[FengShuiView] Analysis success, deducting credit');
        await onDeductCredit?.();
      } else {
        alert('Analysis failed');
      }
    } catch (e) {
      console.error(e);
      alert('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-2xl">←</button>
        <h2 className="text-xl font-bold">Furniture Feng Shui</h2>
      </div>

      <div className="mb-6">
        <label className="w-full aspect-video rounded-2xl bg-white border-2 border-dashed border-yellow-200 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm">
          {image ? (
            <img src={image} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <span className="text-4xl block mb-2">🪴</span>
              <p className="text-sm text-gray-400">Upload photo of your desk or room corner</p>
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
        {loading ? 'Master is analyzing...' : 'Start Feng Shui Diagnosis'}
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
