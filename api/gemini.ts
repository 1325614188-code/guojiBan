import { GoogleGenAI } from "@google/genai";

// 从环境变量加载多个 API Key (支持 GEMINI_API_KEY, GEMINI_API_KEY1, GEMINI_API_KEY2...)
const getApiKeys = (): string[] => {
    const keys: string[] = [];

    // 检查原始变量
    if (process.env.GEMINI_API_KEY) {
        keys.push(...process.env.GEMINI_API_KEY.split(",").map(k => k.trim()).filter(k => k.length > 0));
    }

    // 动态检查 GEMINI_API_KEY1 到 GEMINI_API_KEY100
    for (let i = 1; i <= 100; i++) {
        const key = process.env[`GEMINI_API_KEY${i}`];
        if (key) {
            keys.push(key.trim());
        }
    }

    return keys;
};

let currentKeyIndex = 0;

const getClient = (): GoogleGenAI => {
    const keys = getApiKeys();
    if (keys.length === 0) throw new Error("未配置 GEMINI_API_KEY");
    const key = keys[currentKeyIndex % keys.length];
    return new GoogleGenAI({ apiKey: key });
};

const switchKey = (): void => {
    const keys = getApiKeys();
    if (keys.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        console.log(`[API Rotation] 切换到 Key 索引: ${currentKeyIndex}`);
    }
};

/**
 * 带有超时和自动轮换 Key 的请求包装器
 */
async function requestWithRetry<T>(
    operation: (ai: GoogleGenAI) => Promise<T>,
    maxRetries = 5,
    initialDelay = 1000
): Promise<T> {
    let lastError: any;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const ai = getClient();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("API 请求超时")), 30000)
            );
            return await Promise.race([operation(ai), timeoutPromise]) as T;
        } catch (error: any) {
            lastError = error;
            const status = error?.status || error?.code || error?.response?.status;
            const isOverloaded = status === 503 || error?.message?.includes("overloaded");
            const isRateLimit = status === 429 || error?.message?.includes("Rate limit");

            console.error(`[API Error] 尝试 ${i + 1}/${maxRetries + 1}, 错误: ${error?.message || error}`);

            if (i < maxRetries && (isOverloaded || isRateLimit || error?.message === "API 请求超时")) {
                if (getApiKeys().length > 1) {
                    switchKey();
                }
                const delay = initialDelay * Math.pow(2, i);
                console.log(`[Retry] 等待 ${delay}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, type, images, gender, baseImage, itemImage, itemType, faceImage } = req.body;

        switch (action) {
            case 'analyze': {
                // 图像分析 (颜值打分、舌诊、面诊等)
                const isBeautyScore = type === 'Beauty Score';
                const isFengShui = type === 'Feng Shui Analysis';

                let analysisStyle = '';
                if (isFengShui) {
                    analysisStyle = 'Use traditional Feng Shui terminology (e.g., Mingtang, Azure Dragon, White Tiger, Qi flow, taboos) for in-depth explanation and layout suggestions.';
                } else {
                    analysisStyle = 'Analyze aesthetic or health aspects feature by feature (eyes, nose, mouth, face shape, eyebrows, etc.).';
                }

                const systemInstruction = `
          You are a senior ${isFengShui ? 'Feng Shui Master' : 'Beauty & Lifestyle Influencer'}. Use a typical Instagram/Pinterest style (plenty of emojis, expressive language, beautiful layout, and clear paragraphs).
          Please provide a deep analysis of the image(s) uploaded by the user.
          Requirements:
          1. Use an eye-catching title enclosed in 【】.
          ${isBeautyScore ? '2. [IMPORTANT] The first line of the report MUST be the score in this format: [SCORE:XX], where XX is a specific score between 0-100.' : ''}
          ${isBeautyScore ? '3.' : '2.'} ${analysisStyle}
          ${isBeautyScore ? '4.' : '3.'} Provide targeted ${isFengShui ? 'improvement suggestions or remedies' : 'beauty tips, outfit suggestions, or health/wellness advice'}.
          ${isBeautyScore ? '5.' : '4.'} End with an engaging interactive closing.
          ${isBeautyScore ? '6.' : '5.'} Content should be detailed, professional, and written in a warm, caring tone.
          ALL content must be in English.
        `;
                const prompt = `Analysis Type: ${type}. ${gender ? `Gender: ${gender}` : ''}`;

                const result = await requestWithRetry(async (ai) => {
                    const contents = {
                        parts: [
                            ...images.map((img: string) => ({
                                inlineData: {
                                    mimeType: 'image/jpeg',
                                    data: img.split(',')[1] || img
                                }
                            })),
                            { text: prompt }
                        ]
                    };
                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents,
                        config: { systemInstruction, temperature: 0.7 }
                    });
                    return response.text;
                });

                return res.status(200).json({ result });
            }

            case 'tryOn': {
                // AI 试穿/试戴
                const result = await requestWithRetry(async (ai) => {
                    const prompt = itemType === 'clothes'
                        ? 'Swap the person\'s clothes in the image with the style from the other photo. Keep the person\'s face and environment unchanged. Generate high-quality fashion results. Output must be in 9:16 vertical aspect ratio.'
                        : 'Add the earrings from the other photo to the person in the image. If facing forward, show them on both ears. The result should look natural with harmonious lighting and shadows.';

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: {
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: baseImage.split(',')[1] } },
                                { inlineData: { mimeType: 'image/jpeg', data: itemImage.split(',')[1] } },
                                { text: prompt }
                            ]
                        },
                        // 仅对试穿衣服使用 9:16 竖版比例
                        ...(itemType === 'clothes' ? { config: { outputOptions: { aspectRatio: '9:16' } } } : {})
                    } as any);

                    for (const part of response.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    return null;
                });

                return res.status(200).json({ result });
            }

            case 'hairstyle': {
                // 发型生成 (单个)
                const { hairstyleName, hairstyleDesc } = req.body;

                const result = await requestWithRetry(async (ai) => {
                    const prompt = `Generate a specific trendy hairstyle for this ${gender}: ${hairstyleName}.
          ${hairstyleDesc ? `Specific features: ${hairstyleDesc}` : ''}
          Requirements:
          1. The hairstyle must blend perfectly with the person's face shape and features.
          2. Ensure the hairstyle features are very distinct and clearly different from other styles.
          3. Generate high-quality, realistic results.
          4. Only change the hair; keep the facial features identical.`;

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: {
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: faceImage.split(',')[1] } },
                                { text: prompt }
                            ]
                        }
                    });

                    for (const part of response.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    return null;
                });

                return res.status(200).json({ result });
            }

            case 'makeup': {
                // 美妆效果生成
                const { faceImage, styleName, styleDesc } = req.body;

                if (!faceImage || !styleName) {
                    return res.status(400).json({ error: 'Missing face image or makeup style' });
                }

                const result = await requestWithRetry(async (ai) => {
                    const prompt = `Please apply "${styleName}" style makeup to the person in the image.
${styleDesc ? `Style features: ${styleDesc}` : ''}

[IMPORTANT REQUIREMENTS]:
1. Strictly do NOT change the person's facial features, face shape, or bone structure.
2. Only add makeup effects (eyeshadow, blush, lipstick, eyebrow refinement, etc.) based on the original features.
3. Maintain the original skin tone; the makeup should blend naturally.
4. Generate high-quality, realistic makeup results.
5. Ensure the style is distinct and represents "${styleName}" effectively.`;

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: {
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: faceImage.split(',')[1] } },
                                { text: prompt }
                            ]
                        }
                    } as any);

                    for (const part of response.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    return null;
                });

                return res.status(200).json({ result });
            }

            case 'textAnalysis': {
                // 纯文本分析 (五行车牌等)
                const { prompt } = req.body;

                if (!prompt) {
                    return res.status(400).json({ error: 'Missing analysis content' });
                }

                const result = await requestWithRetry(async (ai) => {
                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: { parts: [{ text: prompt }] },
                        config: { temperature: 0.7 }
                    });
                    return response.text;
                });

                return res.status(200).json({ result });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('[API Error]', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
