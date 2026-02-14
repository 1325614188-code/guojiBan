import React, { useState } from 'react';

interface LicensePlateViewProps {
    onBack: () => void;
    onCheckCredits?: () => Promise<boolean>;
    onDeductCredit?: () => Promise<void>;
}

// Chinese zodiac hour map (Shichen)
const SHICHEN_MAP = [
    { name: 'Zi (Rat)', range: '23:00-00:59', hours: [23, 0] },
    { name: 'Chou (Ox)', range: '01:00-02:59', hours: [1, 2] },
    { name: 'Yin (Tiger)', range: '03:00-04:59', hours: [3, 4] },
    { name: 'Mao (Rabbit)', range: '05:00-06:59', hours: [5, 6] },
    { name: 'Chen (Dragon)', range: '07:00-08:59', hours: [7, 8] },
    { name: 'Si (Snake)', range: '09:00-10:59', hours: [9, 10] },
    { name: 'Wu (Horse)', range: '11:00-12:59', hours: [11, 12] },
    { name: 'Wei (Goat)', range: '13:00-14:59', hours: [13, 14] },
    { name: 'Shen (Monkey)', range: '15:00-16:59', hours: [15, 16] },
    { name: 'You (Rooster)', range: '17:00-18:59', hours: [17, 18] },
    { name: 'Xu (Dog)', range: '19:00-20:59', hours: [19, 20] },
    { name: 'Hai (Pig)', range: '21:00-22:59', hours: [21, 22] },
];

// Car color options
const CAR_COLORS = [
    { name: 'White', color: '#FFFFFF', border: true },
    { name: 'Black', color: '#1a1a1a' },
    { name: 'Silver', color: '#C0C0C0' },
    { name: 'Gray', color: '#808080' },
    { name: 'Red', color: '#DC143C' },
    { name: 'Blue', color: '#1E90FF' },
    { name: 'Green', color: '#228B22' },
    { name: 'Yellow', color: '#FFD700' },
    { name: 'Orange', color: '#FF8C00' },
    { name: 'Brown', color: '#8B4513' },
    { name: 'Purple', color: '#9400D3' },
    { name: 'Pink', color: '#FF69B4' },
];

const LicensePlateView: React.FC<LicensePlateViewProps> = ({ onBack, onCheckCredits, onDeductCredit }) => {
    // Form state
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [shichen, setShichen] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [carColor, setCarColor] = useState('');

    // Analysis state
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Automatically calculate shichen based on specific time
    const handleTimeChange = (time: string) => {
        setBirthTime(time);
        if (time) {
            const hour = parseInt(time.split(':')[0]);
            const matched = SHICHEN_MAP.find(s =>
                s.hours.includes(hour) || (hour === 0 && s.name === 'Zi (Rat)')
            );
            if (matched) {
                setShichen(matched.name);
            }
        }
    };

    // Start analysis
    const handleAnalyze = async () => {
        if (!birthDate || !shichen || !licensePlate || !carColor) {
            setError('Please fill in all information');
            return;
        }

        // Check credits
        const hasCredits = await onCheckCredits?.();
        if (!hasCredits) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const prompt = `You are a master of traditional Chinese Five Elements (Wu Xing) and numerology. Please provide a detailed analysis of the car's Five Elements based on the following information:

**Personal Information:**
- Date of Birth: ${birthDate}
- Hour of Birth (Shichen): ${shichen}
- License Plate Number: ${licensePlate}
- Car Color: ${carColor}

**Please follow these steps for analysis:**

1. **Lunar Calendar Conversion**: Convert the birth date to the Chinese Lunar Calendar.

2. **Eight Characters (Bazi) Analysis**:
   - Calculate the Year, Month, Day, and Hour Pillars.
   - Analyze the distribution of Five Elements (Gold, Wood, Water, Fire, Earth).
   - Identify which elements are lacking, which need to be supplemented, and which are excessive.

3. **User's Likes and Dislikes**:
   - Lucky numbers (which numbers from 1-9 are favorable).
   - Numbers to avoid.
   - Lucky colors.
   - Colors to avoid.

4. **License Plate Analysis**:
   - Analyze the Five Elements attribute of each character in the license plate.
   - Number attributes: 1/6 (Water), 2/7 (Fire), 3/8 (Wood), 4/9 (Gold), 5/0 (Earth).
   - Letter attributes: Based on shape and stroke.

5. **Car Color Analysis**:
   - Analyze the Five Elements attribute of ${carColor}.
   - Determine if it harmonizes with or conflicts with the user's elements.

6. **Comprehensive Score**:
   - Match score between license plate and user (0-100).
   - Match score between car color and user (0-100).
   - Overall "Auspicious Index" (0-100).
   - Conclusion: Is the car auspicious or inauspicious for the owner, and to what degree?

7. **Improvement Suggestions**:
   - If the license plate is unfavorable, give remedies.
   - Recommend items to place in the car to enhance luck.
   - Other adjustment advice.

Please use easy-to-understand language, use emojis to make it lively, and output in markdown format. ALL content must be in English.`;

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'textAnalysis',
                    prompt
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Analysis failed');

            setResult(data.result || data.text);

            // Deduct credit after success
            await onDeductCredit?.();
        } catch (err: any) {
            setError(err.message || 'Analysis failed, please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">🚗 Car Plate Analysis</h2>
            </div>

            <div className="space-y-4">
                {/* Date of Birth */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">📅 Date of Birth</label>
                    <input
                        type="date"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200"
                    />
                </div>

                {/* Birth Time/Shichen */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">⏰ Birth Time</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Exact Time (Optional)</p>
                            <input
                                type="time"
                                value={birthTime}
                                onChange={e => handleTimeChange(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200"
                            />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Or Choose Shichen</p>
                            <select
                                value={shichen}
                                onChange={e => setShichen(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200"
                            >
                                <option value="">Select</option>
                                {SHICHEN_MAP.map(s => (
                                    <option key={s.name} value={s.name}>{s.name} ({s.range})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {shichen && (
                        <p className="text-xs text-cyan-600">Selected: {shichen}</p>
                    )}
                </div>

                {/* License Plate Number */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">🔢 License Plate Number</label>
                    <input
                        type="text"
                        value={licensePlate}
                        onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                        placeholder="e.g. ABC 123"
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 text-center text-lg font-bold tracking-widest"
                        maxLength={11}
                    />
                </div>

                {/* Car Color */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <label className="block text-sm font-bold mb-2">🎨 Car Color</label>
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
                        <p className="text-xs text-cyan-600 mt-2">Selected: {carColor}</p>
                    )}
                </div>

                {/* Analysis Button */}
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50"
                >
                    {loading ? 'Analyzing...' : '🔮 Start Five Elements Analysis'}
                </button>

                {error && (
                    <p className="text-center text-red-500">{error}</p>
                )}

                {/* Analysis Result */}
                {result && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="font-bold mb-3">📊 Analysis Result</h3>
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
