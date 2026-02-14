
import React, { useState } from 'react';

interface MBTITestViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<void>;
}

// MBTI 80 test questions
const MBTI_QUESTIONS = [
    // E vs I (Extraversion vs Introversion) - 20 items
    { q: 'You usually feel energized in social gatherings', dimension: 'EI', direction: 'E' },
    { q: 'You like being the center of attention', dimension: 'EI', direction: 'E' },
    { q: 'You prefer being alone or with a few close friends', dimension: 'EI', direction: 'I' },
    { q: 'You need alone time to recharge your energy', dimension: 'EI', direction: 'I' },
    { q: 'You enjoy initiating conversations with new people', dimension: 'EI', direction: 'E' },
    { q: 'You think carefully before you speak', dimension: 'EI', direction: 'I' },
    { q: 'You like lively environments', dimension: 'EI', direction: 'E' },
    { q: 'You are better at listening than expressing', dimension: 'EI', direction: 'I' },
    { q: 'You often speak up in group settings', dimension: 'EI', direction: 'E' },
    { q: 'You enjoy quiet time alone', dimension: 'EI', direction: 'I' },
    { q: 'You find it easy to chat with strangers', dimension: 'EI', direction: 'E' },
    { q: 'You prefer written communication over verbal exchange', dimension: 'EI', direction: 'I' },
    { q: 'You like attending large parties or events', dimension: 'EI', direction: 'E' },
    { q: 'You feel exhausted after being in a crowd for too long', dimension: 'EI', direction: 'I' },
    { q: 'You are good at livening up the atmosphere', dimension: 'EI', direction: 'E' },
    { q: 'You prefer deep conversations over small talk', dimension: 'EI', direction: 'I' },
    { q: 'You take the initiative to organize social activities', dimension: 'EI', direction: 'E' },
    { q: 'You find thinking alone more effective than discussing', dimension: 'EI', direction: 'I' },
    { q: 'You like to think out loud', dimension: 'EI', direction: 'E' },
    { q: 'You tend to observe before acting', dimension: 'EI', direction: 'I' },
    // S vs N (Sensing vs Intuition) - 20 items
    { q: 'You focus more on the actual situation at hand', dimension: 'SN', direction: 'S' },
    { q: 'You like imagining future possibilities', dimension: 'SN', direction: 'N' },
    { q: 'You pay attention to details and concrete facts', dimension: 'SN', direction: 'S' },
    { q: 'You easily see patterns in things', dimension: 'SN', direction: 'N' },
    { q: 'You trust practical experience more', dimension: 'SN', direction: 'S' },
    { q: 'You like exploring new ideas and theories', dimension: 'SN', direction: 'N' },
    { q: 'You focus on practicality in what you do', dimension: 'SN', direction: 'S' },
    { q: 'You often have sudden inspirations', dimension: 'SN', direction: 'N' },
    { q: 'You like doing things in established ways', dimension: 'SN', direction: 'S' },
    { q: 'You are interested in abstract concepts', dimension: 'SN', direction: 'N' },
    { q: 'You trust what you can see and touch more', dimension: 'SN', direction: 'S' },
    { q: 'You like exploring the deep meaning behind things', dimension: 'SN', direction: 'N' },
    { q: 'You are good at remembering specific details', dimension: 'SN', direction: 'S' },
    { q: 'You often look far into the future', dimension: 'SN', direction: 'N' },
    { q: 'You like learning step by step', dimension: 'SN', direction: 'S' },
    { q: 'You like thinking about "what if"', dimension: 'SN', direction: 'N' },
    { q: 'You focus on the practical application of things', dimension: 'SN', direction: 'S' },
    { q: 'You easily find connections between things', dimension: 'SN', direction: 'N' },
    { q: 'You care more about "what is" than "what could be"', dimension: 'SN', direction: 'S' },
    { q: 'You like metaphors and symbolic expressions', dimension: 'SN', direction: 'N' },
    // T vs F (Thinking vs Feeling) - 20 items
    { q: 'You rely more on logical analysis when making decisions', dimension: 'TF', direction: 'T' },
    { q: 'You care a lot about others\' feelings', dimension: 'TF', direction: 'F' },
    { q: 'You believe fairness is more important than harmony', dimension: 'TF', direction: 'T' },
    { q: 'You easily sense others\' emotions', dimension: 'TF', direction: 'F' },
    { q: 'You like analyzing the pros and cons of a problem', dimension: 'TF', direction: 'T' },
    { q: 'You value harmony in relationships more', dimension: 'TF', direction: 'F' },
    { q: 'You can criticize others objectively', dimension: 'TF', direction: 'T' },
    { q: 'You often praise and encourage others', dimension: 'TF', direction: 'F' },
    { q: 'You believe rationality is more reliable than emotion', dimension: 'TF', direction: 'T' },
    { q: 'You consider the impact on others when making decisions', dimension: 'TF', direction: 'F' },
    { q: 'You are better at solving technical problems', dimension: 'TF', direction: 'T' },
    { q: 'You are good at mediating interpersonal conflicts', dimension: 'TF', direction: 'F' },
    { q: 'You believe rules are more important than exceptions', dimension: 'TF', direction: 'T' },
    { q: 'You consider personal values when making decisions', dimension: 'TF', direction: 'F' },
    { q: 'You like finding logical loopholes in arguments', dimension: 'TF', direction: 'T' },
    { q: 'You easily feel sympathy for others', dimension: 'TF', direction: 'F' },
    { q: 'You believe facts are more important than feelings', dimension: 'TF', direction: 'T' },
    { q: 'You care more about others\' needs', dimension: 'TF', direction: 'F' },
    { q: 'You are blunt when criticizing', dimension: 'TF', direction: 'T' },
    { q: 'You find it hard to say no to requests', dimension: 'TF', direction: 'F' },
    // J vs P (Judging vs Perceiving) - 20 items
    { q: 'You like acting according to a plan', dimension: 'JP', direction: 'J' },
    { q: 'You like keeping your options open', dimension: 'JP', direction: 'P' },
    { q: 'You work in an organized and systematic way', dimension: 'JP', direction: 'J' },
    { q: 'You enjoy spontaneous activities', dimension: 'JP', direction: 'P' },
    { q: 'You like planning in advance', dimension: 'JP', direction: 'J' },
    { q: 'You adapt well to change', dimension: 'JP', direction: 'P' },
    { q: 'You like completing tasks as early as possible', dimension: 'JP', direction: 'J' },
    { q: 'You often finish work just before the deadline', dimension: 'JP', direction: 'P' },
    { q: 'Your daily routine is very regular', dimension: 'JP', direction: 'J' },
    { q: 'You like living as you please', dimension: 'JP', direction: 'P' },
    { q: 'You arrange your schedule ahead of time', dimension: 'JP', direction: 'J' },
    { q: 'You prefer flexibility and adaptation', dimension: 'JP', direction: 'P' },
    { q: 'Completing a task gives you a sense of satisfaction', dimension: 'JP', direction: 'J' },
    { q: 'You like performing multiple tasks simultaneously', dimension: 'JP', direction: 'P' },
    { q: 'Your belongings are arranged neatly and orderly', dimension: 'JP', direction: 'J' },
    { q: 'You think rules can be flexible', dimension: 'JP', direction: 'P' },
    { q: 'You like having clear goals', dimension: 'JP', direction: 'J' },
    { q: 'You enjoy the uncertainty in the exploration process', dimension: 'JP', direction: 'P' },
    { q: 'You often make lists to manage tasks', dimension: 'JP', direction: 'J' },
    { q: 'You prefer to let things take their natural course', dimension: 'JP', direction: 'P' },
];

// MBTI type descriptions
const MBTI_DESCRIPTIONS: Record<string, { title: string; traits: string; careers: string; industries: string; earning: string }> = {
    'INTJ': { title: 'Architect', traits: 'Independent, strategic thinking, high standards', careers: 'Scientist, Strategic Consultant, System Architect, Investment Analyst', industries: 'Tech, Finance, Consulting, R&D', earning: '💰💰💰💰💰 High earning potential, good at long-term wealth planning' },
    'INTP': { title: 'Logician', traits: 'Strong analysis, innovation, independent thinking', careers: 'Programmer, Data Scientist, Researcher, Philosopher', industries: 'Tech, Academia, R&D, Game Dev', earning: '💰💰💰💰 Technical experts with considerable income' },
    'ENTJ': { title: 'Commander', traits: 'Strong leadership, decisive, efficient', careers: 'CEO, Entrepreneur, Lawyer, Project Manager', industries: 'Business, Management, Legal, Finance', earning: '💰💰💰💰💰 Natural business leaders, top-tier wealth creation' },
    'ENTP': { title: 'Debater', traits: 'Innovative, eloquent, agile thinking', careers: 'Founder, Marketing Expert, Product Manager, Lawyer', industries: 'Startups, Advertising, Media, Tech', earning: '💰💰💰💰 Good at finding business opportunities' },
    'INFJ': { title: 'Advocate', traits: 'Visionary, compassionate, idealistic', careers: 'Psychologist, Author, Educator, HR', industries: 'Education, Mental Health, NGO, Arts', earning: '💰💰💰 Values meaning over money, but recognized in specialized fields' },
    'INFP': { title: 'Mediator', traits: 'Idealistic, creative, strong empathy', careers: 'Writer, Artist, Psychologist, Designer', industries: 'Creative Industries, Counseling, Education', earning: '💰💰💰 Pursues passion, wealth follows success' },
    'ENFJ': { title: 'Protagonist', traits: 'Charismatic, inspiring, strong responsibility', careers: 'Trainer, Teacher, HR, Politician', industries: 'Education, Training, PR, Management', earning: '💰💰💰💰 Excellent leadership brings promotion opportunities' },
    'ENFP': { title: 'Campaigner', traits: 'Enthusiastic, creative, sociable', careers: 'Creative Director, Journalist, PR Expert, Actor', industries: 'Media, Entertainment, Advertising', earning: '💰💰💰 Creativity and networking are the biggest assets' },
    'ISTJ': { title: 'Logistician', traits: 'Reliable, organized, detail-oriented', careers: 'Accountant, Auditor, Project Manager, Administrator', industries: 'Finance, Government, Manufacturing, Logistics', earning: '💰💰💰💰 Steady growth, strong financial planning ability' },
    'ISFJ': { title: 'Defender', traits: 'Loyal, attentive, helpful', careers: 'Nurse, Teacher, Administrative Assistant, Customer Success', industries: 'Healthcare, Education, Social Service', earning: '💰💰💰 Stable career development path' },
    'ESTJ': { title: 'Executive', traits: 'Well-organized, pragmatic, leadership', careers: 'Manager, Officer, Judge, Financial Director', industries: 'Management, Law, Finance, Government', earning: '💰💰💰💰 High salaries in management positions' },
    'ESFJ': { title: 'Consul', traits: 'Warm-hearted, outgoing, responsible', careers: 'Sales Manager, Event Planner, HR, Doctor', industries: 'Sales, Healthcare, Education, Hospitality', earning: '💰💰💰 Opportunities through interpersonal networks' },
    'ISTP': { title: 'Virtuoso', traits: 'Flexible, problem solver, practical', careers: 'Engineer, Pilot, Mechanic, Forensic Expert', industries: 'Engineering, Aviation, Tech Maintenance', earning: '💰💰💰💰 Technical experts are highly sought after' },
    'ISFP': { title: 'Adventurer', traits: 'Artistic, gentle, living in the moment', careers: 'Artist, Designer, Photographer, Stylist', industries: 'Arts, Design, Fashion, Beauty', earning: '💰💰💰 Creative work can create unique value' },
    'ESTP': { title: 'Entrepreneur', traits: 'Energetic, action-oriented, adaptable', careers: 'Sales, Athlete, Firefighter, Entrepreneur', industries: 'Sales, Sports, Entertainment, Startups', earning: '💰💰💰💰 Risk-taking leads to high returns' },
    'ESFP': { title: 'Entertainer', traits: 'Enthusiastic, humorous, enjoying life', careers: 'Actor, Host, Sales, Event Planner', industries: 'Entertainment, Sales, F&B, Tourism', earning: '💰💰💰 Charisma is the greatest capital' },
};

const MBTITestView: React.FC<MBTITestViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [result, setResult] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    const handleAnswer = (score: number) => {
        setAnswers(prev => ({ ...prev, [currentQuestion]: score }));
        if (currentQuestion < MBTI_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const calculateResult = async () => {
        // Check credits
        const hasCredits = await onCheckCredits?.();
        if (!hasCredits) return;

        // Calculate scores for each dimension
        const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

        MBTI_QUESTIONS.forEach((q, idx) => {
            const answer = answers[idx] || 3;
            const weight = answer - 3; // -2 到 +2
            if (q.direction === 'E' || q.direction === 'S' || q.direction === 'T' || q.direction === 'J') {
                scores[q.direction as keyof typeof scores] += weight;
            } else {
                scores[q.direction as keyof typeof scores] += weight;
            }
        });

        // Determine type
        const type =
            (scores.E > scores.I ? 'E' : 'I') +
            (scores.S > scores.N ? 'S' : 'N') +
            (scores.T > scores.F ? 'T' : 'F') +
            (scores.J > scores.P ? 'J' : 'P');

        setResult(type);
        setShowResult(true);
        await onDeductCredit?.();
    };

    const progress = ((currentQuestion + 1) / MBTI_QUESTIONS.length) * 100;
    const allAnswered = Object.keys(answers).length === MBTI_QUESTIONS.length;

    if (showResult && result) {
        const desc = MBTI_DESCRIPTIONS[result] || MBTI_DESCRIPTIONS['INTJ'];
        return (
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-2xl">←</button>
                    <h2 className="text-xl font-bold">Talent Test Result</h2>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white text-center">
                    <p className="text-sm opacity-80 mb-2">Your MBTI type is</p>
                    <h1 className="text-5xl font-bold mb-2">{result}</h1>
                    <p className="text-2xl">{desc.title}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">🧠 Traits</h3>
                        <p className="text-gray-600 text-sm">{desc.traits}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">💼 Careers</h3>
                        <p className="text-gray-600 text-sm">{desc.careers}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">🏢 Industries</h3>
                        <p className="text-gray-600 text-sm">{desc.industries}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">💰 Earning Potential</h3>
                        <p className="text-gray-600 text-sm">{desc.earning}</p>
                    </div>
                </div>

                <button onClick={onBack} className="w-full h-14 bg-purple-500 text-white rounded-2xl font-bold">
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">Talent Test</h2>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-gray-500 text-center">{currentQuestion + 1} / {MBTI_QUESTIONS.length}</p>

            {/* Question */}
            <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[120px] flex items-center justify-center">
                <p className="text-lg text-center font-medium text-gray-800">
                    {MBTI_QUESTIONS[currentQuestion].q}
                </p>
            </div>

            {/* Answer Options */}
            <div className="flex flex-col gap-3">
                {[
                    { score: 5, label: 'Strongly Agree', color: 'bg-purple-500' },
                    { score: 4, label: 'Agree', color: 'bg-purple-400' },
                    { score: 3, label: 'Neutral', color: 'bg-gray-400' },
                    { score: 2, label: 'Disagree', color: 'bg-pink-400' },
                    { score: 1, label: 'Strongly Disagree', color: 'bg-pink-500' },
                ].map(opt => (
                    <button
                        key={opt.score}
                        onClick={() => handleAnswer(opt.score)}
                        className={`w-full py-3 rounded-xl text-white font-bold transition-all ${opt.color} ${answers[currentQuestion] === opt.score ? 'ring-4 ring-offset-2 ring-purple-300' : ''}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-bold disabled:opacity-50"
                >
                    Previous
                </button>
                {allAnswered ? (
                    <button
                        onClick={calculateResult}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
                    >
                        View Results ✨
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.min(MBTI_QUESTIONS.length - 1, prev + 1))}
                        disabled={currentQuestion === MBTI_QUESTIONS.length - 1}
                        className="flex-1 py-3 rounded-xl border-2 border-purple-500 text-purple-500 font-bold disabled:opacity-50"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default MBTITestView;
