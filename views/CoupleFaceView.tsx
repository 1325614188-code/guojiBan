
import React, { useState } from 'react';
import { generateXHSStyleReport } from '../services/gemini';
import ReactMarkdown from 'https://esm.sh/react-markdown';

interface CoupleFaceViewProps {
  onBack: () => void;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<void>;
}

const CoupleFaceView: React.FC<CoupleFaceViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
  const [maleImg, setMaleImg] = useState<string | null>(null);
  const [femaleImg, setFemaleImg] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!maleImg || !femaleImg) return;

    // Check credits
    const hasCredits = await onCheckCredits?.();
    if (!hasCredits) return;

    setLoading(true);
    try {
      const res = await generateXHSStyleReport("Couple Face Analysis", [maleImg, femaleImg], "Analyze if the facial features of these two faces complement each other, provide a couple face score and emotional advice. ALL content must be in English.");
      if (res) {
        setReport(res);
        // Deduct credit after success
        console.log('[CoupleFaceView] Analysis success, deducting credit');
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
        <h2 className="text-xl font-bold">Couple Face Lab</h2>
      </div>

      <div className="flex gap-4 mb-6">
        <label className="flex-1 aspect-square rounded-2xl bg-white border-2 border-dashed border-blue-100 flex items-center justify-center overflow-hidden cursor-pointer">
          {maleImg ? <img src={maleImg} className="w-full h-full object-cover" /> : <div className="text-center"><span className="text-3xl block">👨</span><span className="text-[10px] text-gray-400">Male Photo</span></div>}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setMaleImg)} />
        </label>
        <div className="flex items-center text-red-400 text-2xl font-bold">❤️</div>
        <label className="flex-1 aspect-square rounded-2xl bg-white border-2 border-dashed border-pink-100 flex items-center justify-center overflow-hidden cursor-pointer">
          {femaleImg ? <img src={femaleImg} className="w-full h-full object-cover" /> : <div className="text-center"><span className="text-3xl block">👩</span><span className="text-[10px] text-gray-400">Female Photo</span></div>}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setFemaleImg)} />
        </label>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!maleImg || !femaleImg || loading}
        className="w-full h-14 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-2xl font-bold disabled:bg-gray-300 shadow-lg mb-6"
      >
        {loading ? 'AI Matchmaker is calculating...' : 'Check our Couple Face Score'}
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
