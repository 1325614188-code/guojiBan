import { GoogleAuth } from 'google-auth-library';
import { astro } from 'iztro';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * 后端 Gemini 服务 - 整合版本
 * 复刻自参考项目，支持 Vertex AI 强制路由、缓存机制与使用量日志
 * 针对国际版保留了多语言输出逻辑
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 获取 GCP Access Token
 */
async function getAccessToken() {
    const keyStr = process.env.GCP_SERVICE_ACCOUNT_KEY;
    const project = process.env.GCP_PROJECT_ID;

    if (!keyStr || !project) {
        throw new Error("GCP_SERVICE_ACCOUNT_KEY 或 GCP_PROJECT_ID 未配置");
    }

    try {
        let sanitizedKey = keyStr.trim();
        // 兼容 Vercel 环境变量中可能出现的转义引号或多重引号
        if (sanitizedKey.startsWith('"') && sanitizedKey.endsWith('"')) {
            sanitizedKey = sanitizedKey.substring(1, sanitizedKey.length - 1).replace(/\\"/g, '"');
        }
        
        const credentials = JSON.parse(sanitizedKey);
        const auth = new GoogleAuth({
            credentials,
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        return tokenResponse.token;
    } catch (e: any) {
        console.error("[Auth Error] 获取 Access Token 失败:", e.message);
        throw e;
    }
}

/**
 * 适配 Vertex AI 模型路径 (严格锁定 Flash 系列，杜绝 Pro)
 */
const getVertexModelPath = (model: string): string => {
    const mapping: Record<string, string> = {
        'gemini-3-flash-preview': 'gemini-2.5-flash', 
        'gemini-1.5-flash': 'gemini-2.5-flash', 
        'gemini-1.5-pro': 'gemini-2.5-flash', // 强制锁定到 Flash 以节省成本
        'gemini-2.5-flash-image': 'gemini-2.5-flash-image'
    };
    const mapped = mapping[model] || model;
    return `publishers/google/models/${mapped}`;
};

/**
 * 底层 Fetch 调用 Vertex AI REST API
 */
async function callVertexAI(modelName: string, payload: any) {
    const project = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || "us-central1";
    const token = await getAccessToken();

    const modelPath = getVertexModelPath(modelName);
    const url = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${project}/locations/${location}/${modelPath}:generateContent`;

    console.log(`[Vertex AI Request] URL: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
}

/**
 * 记录使用情况日志
 */
async function logUsage(data: {
    action: string;
    model_id: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    duration_ms?: number;
    status: 'success' | 'error';
    error_message?: string;
}) {
    try {
        await supabase.from('gemini_usage_logs').insert([data]);
    } catch (e) {
        console.error("[Usage Log Error] 记录失败:", e);
    }
}

/**
 * 计算请求的 Hash 值做为缓存 key
 */
function getCacheKey(action: string, model: string, body: any): string {
    const data = {
        action,
        model,
        params: {
            type: body.type,
            gender: body.gender,
            itemType: body.itemType,
            birthInfo: body.birthInfo,
            hairstyleName: body.hairstyleName,
            styleName: body.styleName,
            description: body.description,
            industry: body.industry,
            lang: body.lang
        },
        // 对图像数据取指纹（取前1000个字符和后1000个字符）
        imagesFingerprint: [
            body.image,
            body.baseImage,
            body.itemImage,
            body.faceImage,
            ...(body.images || [])
        ].filter(Boolean).map(img => img.substring(0, 1000) + img.substring(img.length - 1000))
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * 带有超时和自动重试的请求包装器 (强制使用 Vertex AI)
 */
async function requestWithRetry<T>(
    modelName: string,
    operation: (model: any) => Promise<T>,
    maxRetries = 2,
    initialDelay = 1000
): Promise<{ result: T; usage?: any; duration: number }> {
    let lastError: any;
    const startTime = Date.now();
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            let lastUsage: any = null;
            const mockModel = {
                generateContent: async (payload: any) => {
                    const finalModelPath = getVertexModelPath(modelName);
                    console.log(`[AI Request Executing] Action: ${modelName}, Final Path: ${finalModelPath}`);

                    const result = await callVertexAI(modelName, payload);
                    lastUsage = result.usageMetadata || result.usage;
                    return { response: result };
                }
            };
            const result = await operation(mockModel);
            return { 
                result, 
                usage: lastUsage, 
                duration: Date.now() - startTime 
            };
        } catch (error: any) {
            lastError = error;
            const message = error?.message || "";
            
            console.error(`[Retry Strategy] 尝试 ${i + 1}/${maxRetries + 1} 失败: ${message}`);

            if (message.includes("429") || message.toLowerCase().includes("too many requests")) {
                console.warn("[Retry Strategy] 触发频率限制 (429)，立即停止重试。");
                throw error;
            }

            if (message.includes("404") || message.includes("401") || message.includes("403")) {
                throw error;
            }

            if (i < maxRetries) {
                const delay = initialDelay * Math.pow(2, i); 
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { action, lang = 'zh-CN' } = req.body;

        // 语言输出映射 (保留国际版配置)
        const langMap: Record<string, string> = {
            'zh-CN': 'Simplified Chinese',
            'zh-TW': 'Traditional Chinese',
            'en': 'English',
            'vi': 'Vietnamese',
            'ja': 'Japanese',
            'th': 'Thai',
            'fr': 'French',
            'es': 'Spanish',
            'de': 'German'
        };
        const targetLangName = langMap[lang] || 'Simplified Chinese';

        // 尝试从缓存获取
        let cacheKey = "";
        const cacheActions = ['analyze', 'ziweiAnalysis', 'marriageAnalysis', 'wealthAnalysis', 'namingAnalysis', 'jadeAppraisal', 'eyeDiagnosis'];
        const imageCacheActions = ['tryOn', 'hairstyle', 'makeup', 'generatePartner'];
        
        let targetModel = "";
        if (cacheActions.includes(action)) targetModel = 'gemini-3-flash-preview';
        else if (imageCacheActions.includes(action)) targetModel = 'gemini-2.5-flash-image';

        if (targetModel) {
            cacheKey = getCacheKey(action, targetModel, req.body);
            const { data: cached } = await supabase.from('gemini_cache').select('result').eq('input_hash', cacheKey).maybeSingle();
            if (cached) {
                console.log(`[Cache Hit] Action: ${action}, Key: ${cacheKey}`);
                return res.status(200).json({ result: cached.result });
            }
        }

        switch (action) {
            case 'detectPhotoContent': {
                const { image } = req.body;
                const { result, usage, duration } = await requestWithRetry('gemini-3-flash-preview', async (model) => {
                    const systemInstruction = "你是一个图像合规性审计专家。判断用户上传的图片是否同时包含【清晰的人脸】以及【至少覆盖肩膀和胸部的上半身部位】。如果是，回复 TRUE，否则回复 FALSE。只需要回复一个单词，不要说明原因。";
                    const contents = [{
                        role: 'user',
                        parts: [
                            { inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] || image } },
                            { text: "这张图是否符合：包含人脸且包含足以试穿衣服的上半身？" }
                        ]
                    }];
                    const response = await model.generateContent({
                        contents,
                        generationConfig: { temperature: 0.1 },
                        systemInstruction: { parts: [{ text: systemInstruction }] }
                    });
                    const resultText = response.response.candidates[0].content.parts[0].text || "";
                    return resultText.trim().toUpperCase().includes('TRUE');
                });

                logUsage({
                    action,
                    model_id: 'gemini-3-flash-preview',
                    prompt_tokens: usage?.promptTokenCount,
                    completion_tokens: usage?.candidatesTokenCount,
                    total_tokens: usage?.totalTokenCount,
                    duration_ms: duration,
                    status: 'success'
                });

                return res.status(200).json({ valid: result });
            }

            case 'analyze': {
                const { type, images, gender } = req.body;
                const isFengShui = type === '摆设风水分析';
                const isBeautyScore = type === '颜值打分';

                const systemInstruction = `
          你是一位资深${isFengShui ? '风水命理大师' : '美妆生活博主'}，语气采用典型的小红书风格。
          请针对用户上传的图片进行深度分析。
          【语言要求】：必须使用 ${targetLangName} 进行输出。
          要求：
          1. 标题要吸引人，使用【】括起来。
          ${isBeautyScore ? '2. 【重要】报告的第一行必须是分数，格式为：[SCORE:XX分]，其中 XX 是 0-100 之间的具体分数。' : ''}
          3. ${isFengShui ? '按中国传统风水术语进行深度详解' : '按五官逐个进行美学或健康角度的详细分析'}。
          4. 给出针对性的${isFengShui ? '改进建议或化解方案' : '变美建议、穿搭建议 or 健康调理方案'}。
        `;
                const prompt = `分析类型：${type}。${gender ? `性别：${gender}` : ''}`;

                const { result, usage, duration } = await requestWithRetry('gemini-3-flash-preview', async (model) => {
                    const contents = [{
                        role: 'user',
                        parts: [
                            ...images.map((img: string) => ({
                                inlineData: { mimeType: 'image/jpeg', data: img.split(',')[1] || img }
                            })),
                            { text: prompt }
                        ]
                    }];
                    const response = await model.generateContent({
                        contents,
                        generationConfig: { temperature: 0.7 },
                        systemInstruction: { parts: [{ text: systemInstruction }] }
                    });
                    return response.response.candidates[0].content.parts[0].text;
                });

                logUsage({
                    action: `${action}:${type}`,
                    model_id: 'gemini-3-flash-preview',
                    prompt_tokens: usage?.promptTokenCount,
                    completion_tokens: usage?.candidatesTokenCount,
                    total_tokens: usage?.totalTokenCount,
                    duration_ms: duration,
                    status: 'success'
                });

                if (result && cacheKey) {
                    await supabase.from('gemini_cache').upsert({ input_hash: cacheKey, result });
                }

                return res.status(200).json({ result });
            }

            case 'tryOn': {
                const { baseImage, itemImage, itemType } = req.body;
                const { result, usage, duration } = await requestWithRetry('gemini-2.5-flash-image', async (model) => {
                    const prompt = itemType === 'clothes'
                        ? '将图中人物的衣服换成另一张图中的款式，保持人物面容和环境不变，生成高品质穿搭效果图。输出图片比例必须为9:16竖版。'
                        : '在图中人物的耳朵上戴上另一张图中的耳坠。效果要自然，光影和谐。';

                    const response = await model.generateContent({
                        contents: [{
                            role: 'user',
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: baseImage.split(',')[1] } },
                                { inlineData: { mimeType: 'image/jpeg', data: itemImage.split(',')[1] } },
                                { text: prompt }
                            ]
                        }],
                        generationConfig: { temperature: 0.4 }
                    });

                    const parts = response.response.candidates?.[0]?.content?.parts || [];
                    for (const part of parts) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    return null;
                });

                logUsage({
                    action,
                    model_id: 'gemini-2.5-flash-image',
                    prompt_tokens: usage?.promptTokenCount,
                    completion_tokens: usage?.candidatesTokenCount,
                    total_tokens: usage?.totalTokenCount,
                    duration_ms: duration,
                    status: 'success'
                });

                if (result && cacheKey) {
                    await supabase.from('gemini_cache').upsert({ input_hash: cacheKey, result });
                }

                return res.status(200).json({ result });
            }

            case 'hairstyle':
            case 'makeup': {
                const isHairstyle = action === 'hairstyle';
                const { faceImage, gender, hairstyleName, hairstyleDesc, styleName, styleDesc } = req.body;
                const name = isHairstyle ? hairstyleName : styleName;
                const desc = isHairstyle ? hairstyleDesc : styleDesc;

                const { result, usage, duration } = await requestWithRetry('gemini-2.5-flash-image', async (model) => {
                    const prompt = isHairstyle 
                        ? `为图中这位${gender}性生成发型：${name}。特点：${desc}。保持人脸特征不变。`
                        : `为图中人物化上"${name}"风格妆容。特点：${desc}。不可改变五官骨骼。`;

                    const response = await model.generateContent({
                        contents: [{
                            role: 'user',
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: faceImage.split(',')[1] } },
                                { text: prompt }
                            ]
                        }]
                    });

                    const parts = response.response.candidates?.[0]?.content?.parts || [];
                    for (const part of parts) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    return null;
                });

                logUsage({
                    action,
                    model_id: 'gemini-2.5-flash-image',
                    prompt_tokens: usage?.promptTokenCount,
                    completion_tokens: usage?.candidatesTokenCount,
                    total_tokens: usage?.totalTokenCount,
                    duration_ms: duration,
                    status: 'success'
                });

                if (result && cacheKey) {
                    await supabase.from('gemini_cache').upsert({ input_hash: cacheKey, result });
                }

                return res.status(200).json({ result });
            }

            case 'marriageAnalysis':
            case 'wealthAnalysis': {
                const { birthInfo, gender } = req.body;
                const isMarriage = action === 'marriageAnalysis';
                const systemInstruction = isMarriage 
                    ? `你是一位姻缘大师，分析用户出生信息。给出一份小红书风格的报告数据。末尾一定要包含 [PARTNER_DESC:xxxxx] 格式。要求必须使用 ${targetLangName} 输出。`
                    : `你是一位财运解析大师，分析用户出生信息。给出一份小红书风格的报告数据。要求必须使用 ${targetLangName} 输出。`;
                
                const prompt = `用户信息：${birthInfo}，性别：${gender}。`;

                const { result, usage, duration } = await requestWithRetry('gemini-3-flash-preview', async (model) => {
                    const response = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7 },
                        systemInstruction: { parts: [{ text: systemInstruction }] }
                    });
                    return response.response.candidates[0].content.parts[0].text;
                });

                logUsage({
                    action,
                    model_id: 'gemini-3-flash-preview',
                    prompt_tokens: usage?.promptTokenCount,
                    completion_tokens: usage?.candidatesTokenCount,
                    total_tokens: usage?.totalTokenCount,
                    duration_ms: duration,
                    status: 'success'
                });

                if (result && cacheKey) {
                    await supabase.from('gemini_cache').upsert({ input_hash: cacheKey, result });
                }

                return res.status(200).json({ result });
            }

            case 'ziweiAnalysis': {
                const { birthInfo, gender } = req.body;
                const match = birthInfo.match(/(\d+)年(\d+)月(\d+)日\s+(\d+):(\d+)/);
                if (!match) return res.status(400).json({ error: '无效日期格式' });
                
                const [_, y, m, d, h] = match;
                const hourNum = parseInt(h);

                try {
                    const chart = astro.bySolar(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, hourNum, gender, true, 'zh-CN');
                    const payloadData = {
                        basic: { gender: chart.gender, solarDate: chart.solarDate, chineseZodiac: chart.chineseZodiac },
                        palaces: chart.palaces.map(p => ({
                            name: p.name,
                            isLifePalace: p.isLifePalace,
                            majorStars: p.majorStars?.map(s => s.name) || [],
                            minorStars: p.minorStars?.map(s => s.name) || [],
                            adjectiveStars: p.adjectiveStars?.map(s => s.name) || []
                        }))
                    };

                    const systemInstruction = `你是一位命理大师。请根据星盘数据生成报告。要求使用 ${targetLangName} 输出，并采用小红书风格。`;
                    const prompt = `星盘：${JSON.stringify(payloadData)}`;

                    const { result, usage, duration } = await requestWithRetry('gemini-3-flash-preview', async (model) => {
                        const response = await model.generateContent({
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.7 },
                            systemInstruction: { parts: [{ text: systemInstruction }] }
                        });
                        return response.response.candidates[0].content.parts[0].text;
                    });

                    logUsage({
                        action,
                        model_id: 'gemini-3-flash-preview',
                        prompt_tokens: usage?.promptTokenCount,
                        completion_tokens: usage?.candidatesTokenCount,
                        total_tokens: usage?.totalTokenCount,
                        duration_ms: duration,
                        status: 'success'
                    });

                    if (result && cacheKey) {
                        await supabase.from('gemini_cache').upsert({ input_hash: cacheKey, result });
                    }

                    return res.status(200).json({ result });
                } catch (e: any) {
                    return res.status(500).json({ error: e.message });
                }
            }

            case 'generatePartner': {
                const { description, gender, userImage } = req.body;
                const targetGender = gender === '男' ? '女' : '男';

                const { result, usage, duration } = await requestWithRetry('gemini-2.5-flash-image', async (model) => {
                    const prompt = `生成一位高度匹配的中华${targetGender}性。描述：${description}。照片级真实。请参考：${targetLangName} 描述意境。`;
                    const parts: any[] = [];
                    if (userImage) {
                        parts.push({ inlineData: { mimeType: 'image/jpeg', data: userImage.split(',')[1] } });
                    }
                    parts.push({ text: prompt });

                    const response = await model.generateContent({
                        contents: [{ role: 'user', parts }]
                    });

                    const partsOut = response.response.candidates?.[0]?.content?.parts || [];
                    for (const part of partsOut) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    return null;
                });

                logUsage({
                    action,
                    model_id: 'gemini-2.5-flash-image',
                    prompt_tokens: usage?.promptTokenCount,
                    completion_tokens: usage?.candidatesTokenCount,
                    total_tokens: usage?.totalTokenCount,
                    duration_ms: duration,
                    status: 'success'
                });

                if (result && cacheKey) {
                    await supabase.from('gemini_cache').upsert({ input_hash: cacheKey, result });
                }

                return res.status(200).json({ result });
            }

            case 'textAnalysis': {
                const { prompt: userPrompt } = req.body;
                const { result, usage, duration } = await requestWithRetry('gemini-3-flash-preview', async (model) => {
                    const response = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: `${userPrompt}\n请使用 ${targetLangName} 回复。` }] }],
                        generationConfig: { temperature: 0.7 }
                    });
                    return response.response.candidates[0].content.parts[0].text;
                });

                logUsage({
                    action,
                    model_id: 'gemini-3-flash-preview',
                    prompt_tokens: usage?.promptTokenCount,
                    completion_tokens: usage?.candidatesTokenCount,
                    total_tokens: usage?.totalTokenCount,
                    duration_ms: duration,
                    status: 'success'
                });

                if (result && cacheKey) {
                    await supabase.from('gemini_cache').upsert({ input_hash: cacheKey, result });
                }

                return res.status(200).json({ result });
            }

            case 'jadeAppraisal':
            case 'eyeDiagnosis': {
                const { images } = req.body;
                const isJade = action === 'jadeAppraisal';
                const systemInstruction = isJade 
                    ? `你是一位翡翠鉴定专家。分析图片并返回 JSON。必须使用 ${targetLangName} 输出内容。`
                    : `你是一位中医专家。分析眼睛照片并返回 JSON。必须使用 ${targetLangName} 输出内容。`;

                const { result, usage, duration } = await requestWithRetry('gemini-3-flash-preview', async (model) => {
                    const response = await model.generateContent({
                        contents: [{
                            role: 'user',
                            parts: [
                                ...images.map((img: string) => ({
                                    inlineData: { mimeType: 'image/jpeg', data: img.includes(',') ? img.split(',')[1] : img }
                                })),
                                { text: "开始分析并返回 JSON。" }
                            ]
                        }],
                        generationConfig: { 
                            temperature: 0.2,
                            responseMimeType: "application/json"
                        },
                        systemInstruction: { parts: [{ text: systemInstruction }] }
                    });

                    return JSON.parse(response.response.candidates[0].content.parts[0].text || "{}");
                });

                logUsage({
                    action,
                    model_id: 'gemini-3-flash-preview',
                    prompt_tokens: usage?.promptTokenCount,
                    completion_tokens: usage?.candidatesTokenCount,
                    total_tokens: usage?.totalTokenCount,
                    duration_ms: duration,
                    status: 'success'
                });

                if (result && cacheKey) {
                    await supabase.from('gemini_cache').upsert({ input_hash: cacheKey, result: JSON.stringify(result) });
                }

                return res.status(200).json({ result });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('[API Error]', error.message);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
