
import React, { useState } from 'react';
import { analyzeImage } from '../services/gemini';
import ReactMarkdown from 'https://esm.sh/react-markdown';

interface CalendarViewProps {
  onBack: () => void;
  onCheckCredits?: () => Promise<boolean>;
  onDeductCredit?: () => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
  const [todo, setTodo] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  const handleCheck = async () => {
    if (!todo) return;

    // Check credits
    const hasCredits = await onCheckCredits?.();
    if (!hasCredits) return;

    setLoading(true);
    try {
      const systemInstruction = "You are an expert blogger in traditional Chinese almanacs and fashion styling. Your tone is warm and lifestyle-oriented. ALL content must be in English.";
      const prompt = `Today is ${today}. I plan to: ${todo}. Based on today's almanac background, provide auspicious and inauspicious suggestions, recommend suitable outfit colors to enhance luck, and format it in a trendy social media style (like Instagram/Pinterest).`;
      const res = await analyzeImage(prompt, [], systemInstruction);
      if (res) {
        setReport(res);
        // Deduct credit after success
        console.log('[CalendarView] Analysis success, deducting credit');
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
        <h2 className="text-xl font-bold">Daily Guide</h2>
      </div>

      <div className="bg-[#C69C6D] text-white p-6 rounded-3xl shadow-xl mb-8">
        <p className="text-sm opacity-80 mb-1">Date: {today}</p>
        <h3 className="text-2xl font-bold mb-4">May Everything Go Well Today ✨</h3>
        <div className="bg-white/10 p-4 rounded-xl">
          <label className="block text-sm font-bold mb-2">What are your plans for today?</label>
          <input
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            placeholder="e.g., job interview, date, moving..."
            className="w-full bg-white text-gray-800 p-3 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleCheck}
        disabled={!todo || loading}
        className="w-full h-14 bg-[#C69C6D] text-white rounded-2xl font-bold shadow-lg mb-6 flex items-center justify-center gap-2"
      >
        {loading ? 'Consulting the stars...' : 'Check Fortune & Outfit Advice'}
      </button>

      {report && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-50 prose max-w-none">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
