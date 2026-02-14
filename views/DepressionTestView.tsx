
import React, { useState } from 'react';

interface DepressionTestViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<void>;
}

// Depression self-test 80 questions (based on PHQ-9, BDI-II and other expanded scales)
const DEPRESSION_QUESTIONS = [
    // Mood - 12 items
    { q: 'In the past two weeks, have you often felt down, depressed, or hopeless?', category: 'mood' },
    { q: 'Do you feel that life has no meaning?', category: 'mood' },
    { q: 'Do you often feel sadness that you cannot control?', category: 'mood' },
    { q: 'Do you cry easily over small things?', category: 'mood' },
    { q: 'Do you feel empty inside?', category: 'mood' },
    { q: 'Do you feel hopeless about the future?', category: 'mood' },
    { q: 'Do you feel like a failure?', category: 'mood' },
    { q: 'Do you often feel unexplained fear or anxiety?', category: 'mood' },
    { q: 'Do you often feel irritable or easily annoyed?', category: 'mood' },
    { q: 'Do you feel unable to control your emotions?', category: 'mood' },
    { q: 'Do you often feel lonely?', category: 'mood' },
    { q: 'Do you find it hard to make yourself happy?', category: 'mood' },
    // Interest - 10 items
    { q: 'Have you lost interest in things you used to enjoy?', category: 'interest' },
    { q: 'Do you feel like you have no energy for anything?', category: 'interest' },
    { q: 'Do you no longer look forward to anything?', category: 'interest' },
    { q: 'Do you feel that life has become dull and boring?', category: 'interest' },
    { q: 'Do you find it hard to get satisfaction from pleasant activities?', category: 'interest' },
    { q: 'Have you stopped wanting to participate in social activities?', category: 'interest' },
    { q: 'Have you lost enthusiasm for work or study?', category: 'interest' },
    { q: 'Do you no longer care about your appearance or dress?', category: 'interest' },
    { q: 'Have you lost interest in sex or intimate relationships?', category: 'interest' },
    { q: 'Do you feel that music, movies, or other entertainment can no longer make you happy?', category: 'interest' },
    // Sleep - 10 items
    { q: 'Do you have trouble falling asleep?', category: 'sleep' },
    { q: 'Do you often wake up in the middle of the night?', category: 'sleep' },
    { q: 'Do you find it hard to fall back asleep after waking up early?', category: 'sleep' },
    { q: 'Do you sleep too much (more than 10 hours a day)?', category: 'sleep' },
    { q: 'Do you still feel tired even after sleeping for a long time?', category: 'sleep' },
    { q: 'Do you have nightmares or poor sleep quality?', category: 'sleep' },
    { q: 'Are you afraid of falling asleep?', category: 'sleep' },
    { q: 'Is your sleep schedule reversed or disrupted?', category: 'sleep' },
    { q: 'Do you often wake up startled during sleep?', category: 'sleep' },
    { q: 'Do you feel that no matter how long you sleep, it\'s not enough?', category: 'sleep' },
    // Energy - 10 items
    { q: 'Do you often feel tired or have no energy?', category: 'energy' },
    { q: 'Do you feel heavy or weak in your limbs?', category: 'energy' },
    { q: 'Do you feel unable to recover energy even after resting?', category: 'energy' },
    { q: 'Do you find it difficult to complete daily tasks?', category: 'energy' },
    { q: 'Do you feel that your reactions have slowed down?', category: 'energy' },
    { q: 'Do you feel that your mind is not clear enough?', category: 'energy' },
    { q: 'Do you feel that getting out of bed is a very difficult task?', category: 'energy' },
    { q: 'Do you often feel physically exhausted?', category: 'energy' },
    { q: 'Do you feel that speaking or thinking takes a lot of effort?', category: 'energy' },
    { q: 'Do you feel exhausted even after doing simple things?', category: 'energy' },
    // Appetite - 6 items
    { q: 'Has your appetite significantly decreased?', category: 'appetite' },
    { q: 'Are you eating much more than usual?', category: 'appetite' },
    { q: 'Has your weight changed significantly?', category: 'appetite' },
    { q: 'Have you lost interest in food?', category: 'appetite' },
    { q: 'Do you often forget to eat?', category: 'appetite' },
    { q: 'Do you use binge eating to relieve emotions?', category: 'appetite' },
    // Self-evaluation - 10 items
    { q: 'Do you often blame yourself?', category: 'self' },
    { q: 'Do you feel that you are not as good as others?', category: 'self' },
    { q: 'Do you feel disappointed in yourself?', category: 'self' },
    { q: 'Do you feel like you are a burden to others?', category: 'self' },
    { q: 'Do you feel dissatisfied with your appearance?', category: 'self' },
    { q: 'Do you feel worthless?', category: 'self' },
    { q: 'Do you often regret past decisions?', category: 'self' },
    { q: 'Do you feel completely useless?', category: 'self' },
    { q: 'Do you often criticize or deny yourself?', category: 'self' },
    { q: 'Do you feel that you are not worthy of being loved?', category: 'self' },
    // Attention - 8 items
    { q: 'Do you find it hard to concentrate?', category: 'attention' },
    { q: 'Do you find it hard to make decisions?', category: 'attention' },
    { q: 'Do you often daydream or zone out?', category: 'attention' },
    { q: 'Has your memory significantly declined?', category: 'attention' },
    { q: 'Do you find it difficult to complete tasks that require thinking?', category: 'attention' },
    { q: 'Do you often forget important things?', category: 'attention' },
    { q: 'Do you find it hard to keep up with others\' conversations?', category: 'attention' },
    { q: 'Do you find it difficult to understand what you are reading?', category: 'attention' },
    // Behavior - 8 items
    { q: 'Have your movements become slower than usual?', category: 'behavior' },
    { q: 'Do you often feel restless?', category: 'behavior' },
    { q: 'Have you reduced contact with friends and family?', category: 'behavior' },
    { q: 'Do you not want to go out or leave home?', category: 'behavior' },
    { q: 'Do you avoid tasks that need to be completed?', category: 'behavior' },
    { q: 'Do you often cancel pre-arranged plans?', category: 'behavior' },
    { q: 'Do you lie in bed for a long time not wanting to move?', category: 'behavior' },
    { q: 'Do you neglect personal hygiene (e.g., not bathing, not brushing teeth)?', category: 'behavior' },
    // Severe - 6 items
    { q: 'Have you ever had the thought "I\'d be better off dead"?', category: 'severe' },
    { q: 'Have you thought about harming yourself?', category: 'severe' },
    { q: 'Do you feel that living has no meaning?', category: 'severe' },
    { q: 'Do you often think about death?', category: 'severe' },
    { q: 'Have you ever harmed yourself?', category: 'severe' },
    { q: 'Do you have a specific suicide plan?', category: 'severe' },
];

const DepressionTestView: React.FC<DepressionTestViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResult, setShowResult] = useState(false);
    const [totalScore, setTotalScore] = useState(0);

    const handleAnswer = (score: number) => {
        setAnswers(prev => ({ ...prev, [currentQuestion]: score }));
        if (currentQuestion < DEPRESSION_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const calculateResult = async () => {
        // Check credits
        const hasCredits = await onCheckCredits?.();
        if (!hasCredits) return;

        // Calculate total score
        let score = 0;
        Object.values(answers).forEach((a: number) => {
            score += a;
        });

        setTotalScore(score);
        setShowResult(true);
        await onDeductCredit?.();
    };

    const getResultLevel = (score: number): { level: string; color: string; emoji: string; desc: string; advice: string } => {
        const maxScore = DEPRESSION_QUESTIONS.length * 3;
        const percentage = (score / maxScore) * 100;

        if (percentage <= 20) {
            return {
                level: 'Emotionally Healthy',
                color: 'from-green-400 to-emerald-500',
                emoji: '😊',
                desc: 'Congratulations! Your emotional state is very healthy, with no depressive tendencies.',
                advice: 'Continue to maintain a positive and optimistic attitude towards life, exercise more, socialize more, and keep good living habits.'
            };
        } else if (percentage <= 40) {
            return {
                level: 'Mild Emotional Fluctuations',
                color: 'from-yellow-400 to-orange-400',
                emoji: '🙂',
                desc: 'You have some mild emotional fluctuations, which are normal reactions to life stress.',
                advice: 'It is recommended to properly adjust your routine, increase exercise and social activities, and develop some hobbies. If you continue to feel troubled, you can talk to friends.'
            };
        } else if (percentage <= 60) {
            return {
                level: 'Moderate Emotional Distress',
                color: 'from-orange-400 to-red-400',
                emoji: '😔',
                desc: 'You may be experiencing some degree of emotional distress and need to pay attention to your mental health.',
                advice: 'It is suggested to seek support from family and friends and consider consulting a professional counselor. Maintain a regular routine, exercise appropriately, and avoid being alone for too long.'
            };
        } else if (percentage <= 80) {
            return {
                level: 'Significant Depressive Tendency',
                color: 'from-red-400 to-red-600',
                emoji: '😢',
                desc: 'You may have a clear depressive tendency, and it is recommended to seek professional help as soon as possible.',
                advice: 'It is strongly suggested to book an appointment with a professional psychologist or psychiatrist for evaluation and treatment as soon as possible. Please tell your friends and family how you feel; do not bear it alone.'
            };
        } else {
            return {
                level: 'Severe Depressive Tendency',
                color: 'from-red-600 to-purple-700',
                emoji: '🆘',
                desc: 'Your test results show a potential for severe depressive tendency. Please seek professional help immediately.',
                advice: 'Please contact a mental health crisis intervention hotline or visit a hospital psychiatric department immediately. You are not alone; professional help can make you feel better.'
            };
        }
    };

    const progress = ((currentQuestion + 1) / DEPRESSION_QUESTIONS.length) * 100;
    const allAnswered = Object.keys(answers).length === DEPRESSION_QUESTIONS.length;

    if (showResult) {
        const result = getResultLevel(totalScore);
        const maxScore = DEPRESSION_QUESTIONS.length * 3;
        return (
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-2xl">←</button>
                    <h2 className="text-xl font-bold">Depression Result</h2>
                </div>

                <div className={`bg-gradient-to-br ${result.color} rounded-3xl p-6 text-white text-center`}>
                    <p className="text-6xl mb-3">{result.emoji}</p>
                    <h1 className="text-2xl font-bold mb-2">{result.level}</h1>
                    <p className="text-lg opacity-90">Score: {totalScore} / {maxScore}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">📊 Interpretation</h3>
                        <p className="text-gray-600 text-sm">{result.desc}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">💡 Advice</h3>
                        <p className="text-gray-600 text-sm">{result.advice}</p>
                    </div>
                </div>

                <div className="bg-pink-50 rounded-2xl p-4 border border-pink-200">
                    <p className="text-sm text-pink-700">
                        ⚠️ Disclaimer: This test is for reference only and cannot replace professional medical diagnosis. If needed, please consult a professional psychiatrist.
                    </p>
                </div>

                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 font-bold mb-1">🆘 Mental Health Hotlines</p>
                    <p className="text-sm text-blue-600">Global/Local Crisis Hotline: Please contact your local emergency services.</p>
                </div>

                <button onClick={onBack} className="w-full h-14 bg-blue-500 text-white rounded-2xl font-bold">
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">Depression Test</h2>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-gray-500 text-center">{currentQuestion + 1} / {DEPRESSION_QUESTIONS.length}</p>

            {/* Question */}
            <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[120px] flex items-center justify-center">
                <p className="text-lg text-center font-medium text-gray-800">
                    {DEPRESSION_QUESTIONS[currentQuestion].q}
                </p>
            </div>

            {/* Answer Options */}
            <div className="flex flex-col gap-3">
                {[
                    { score: 0, label: 'Not at all', color: 'bg-green-500' },
                    { score: 1, label: 'Occasionally', color: 'bg-yellow-500' },
                    { score: 2, label: 'Often', color: 'bg-orange-500' },
                    { score: 3, label: 'Almost every day', color: 'bg-red-500' },
                ].map(opt => (
                    <button
                        key={opt.score}
                        onClick={() => handleAnswer(opt.score)}
                        className={`w-full py-3 rounded-xl text-white font-bold transition-all ${opt.color} ${answers[currentQuestion] === opt.score ? 'ring-4 ring-offset-2 ring-blue-300' : ''}`}
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
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold"
                    >
                        View Results 📊
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.min(DEPRESSION_QUESTIONS.length - 1, prev + 1))}
                        disabled={currentQuestion === DEPRESSION_QUESTIONS.length - 1}
                        className="flex-1 py-3 rounded-xl border-2 border-blue-500 text-blue-500 font-bold disabled:opacity-50"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default DepressionTestView;
