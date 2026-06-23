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
/**
 * 从 app_config 数据库表加载大模型配置，如果数据库未配置则退回到 process.env。
 */
async function getAiConfig() {
    const { data: configs, error } = await supabase
        .from('app_config')
        .select('key, value');
    
    const configMap: Record<string, string> = {};
    if (!error && configs) {
        configs.forEach(c => {
            configMap[c.key] = c.value;
        });
    }

    const config = {
        AI_PROVIDER: (configMap['ai_provider'] || process.env.AI_PROVIDER || 'vertex').trim().toLowerCase(),
        CHAT_AI_PROVIDER: (configMap['chat_ai_provider'] || process.env.CHAT_AI_PROVIDER || 'follow').trim().toLowerCase(),
        GEMINI_API_KEY: configMap['gemini_api_key'] || process.env.GEMINI_API_KEY || '',
        DEEPSEEK_API_KEY: configMap['deepseek_api_key'] || process.env.DEEPSEEK_API_KEY || '',
        GCP_PROJECT_ID: configMap['gcp_project_id'] || process.env.GCP_PROJECT_ID || 'vertex-ai-for-vercel',
        GCP_LOCATION: configMap['gcp_location'] || process.env.GCP_LOCATION || 'us-central1',
        GCP_VERTEX_PROXY: configMap['vertex_proxy_url'] || process.env.GCP_VERTEX_PROXY || 'https://vertex.marylab.top/api/vertex-proxy',
        GCP_VERTEX_ONLY_PROXY: configMap['vertex_only_proxy_url'] || process.env.GCP_VERTEX_ONLY_PROXY || '',
        VERTEX_PROXY_KEY: configMap['vertex_proxy_key'] || process.env.VERTEX_PROXY_KEY || process.env.EASYROUTER_API_KEY || '',
        GCP_SERVICE_ACCOUNT_KEY: configMap['gcp_service_account_key'] || process.env.GCP_SERVICE_ACCOUNT_KEY || ''
    };

    if (!config.GCP_VERTEX_ONLY_PROXY) {
        config.GCP_VERTEX_ONLY_PROXY = config.GCP_VERTEX_PROXY;
    }

    if (!config.DEEPSEEK_API_KEY) {
        config.DEEPSEEK_API_KEY = config.GEMINI_API_KEY;
    }

    return config;
}

/**
 * 获取 GCP Access Token (支持多个 GCP_SERVICE_ACCOUNT_KEY 轮换)
 */
async function getAccessToken(config: any) {
    const keyStr = config.GCP_SERVICE_ACCOUNT_KEY;
    const project = config.GCP_PROJECT_ID;

    if (!keyStr || !project) {
        throw new Error("GCP_SERVICE_ACCOUNT_KEY 或 GCP_PROJECT_ID 未配置");
    }

    try {
        let sanitizedKey = keyStr.trim();
        // 兼容 Vercel 环境变量中可能出现的转义双引号
        if (sanitizedKey.startsWith('"') && sanitizedKey.endsWith('"')) {
            sanitizedKey = sanitizedKey.substring(1, sanitizedKey.length - 1).replace(/\\"/g, '"');
        }

        // 识别是否配置了多个 Service Account Key，支持换行或者 '|||' 分隔
        const keyLines = sanitizedKey.split(/\r?\n|\|\|\|/).map((k: string) => k.trim()).filter(Boolean);
        if (keyLines.length === 0) {
            throw new Error("GCP_SERVICE_ACCOUNT_KEY 配置内容为空");
        }

        // 轮换机制：随机选择一个 Key
        const randomIndex = Math.floor(Math.random() * keyLines.length);
        const selectedKey = keyLines[randomIndex];
        console.log(`[Vertex Auth] GCP 密钥轮换：共配置了 ${keyLines.length} 个密钥，当前选中第 ${randomIndex + 1} 个密钥进行授权调用。`);

        const credentials = JSON.parse(selectedKey);
        
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
 * 底层 Fetch 调用 Vertex AI REST API (支持直连、以及 EasyRouter 免 Token 网关代理)
 */
async function callVertexAI(modelName: string, payload: any, config: any) {
    const providerMode = config.AI_PROVIDER === 'hybrid' ? 'vertex' : config.AI_PROVIDER;
    
    // 1. 获取 Token/Key
    let token = "";
    if (providerMode === 'easyrouter' && config.VERTEX_PROXY_KEY) {
        token = config.VERTEX_PROXY_KEY;
    } else {
        token = await getAccessToken(config);
    }

    // 2. 映射模型为 Vertex 兼容路径
    const modelPath = getVertexModelPath(modelName);

    // 3. 拼接目标端点 URL
    let url = "";
    if (providerMode === 'easyrouter' && config.GCP_VERTEX_PROXY) {
        // EasyRouter 格式：${base}/v1beta/models/${modelNameOnly}:generateContent
        let baseUrl = config.GCP_VERTEX_PROXY.replace(/\/$/, "");
        if (baseUrl.includes("vertex-proxy")) {
            baseUrl = baseUrl.replace("vertex-proxy", "easyrouter-proxy");
        }
        const mappedModel = getVertexModelPath(modelName).split('/').pop();
        url = `${baseUrl}/v1beta/models/${mappedModel}:generateContent`;
        console.log(`[AI Client - EasyRouter] Route: ${url}`);
    } else {
        // Vertex 格式 直连
        url = `https://${config.GCP_LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${config.GCP_PROJECT_ID}/locations/${config.GCP_LOCATION}/${modelPath}:generateContent`;
        console.log(`[AI Client - Vertex Direct] Route: ${url}`);
    }

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
 * 调用 Google AI Studio 的 Gemini API
 */
async function callGeminiStudio(modelName: string, payload: any, config: any) {
    const key = config.GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_API_KEY 未配置，无法调用 Gemini Studio API");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
    console.log(`[Gemini Studio Request] URL: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Studio API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
}

/**
 * 直接调用 DeepSeek 官方 API 接口 (将 Gemini 格式请求转换为 OpenAI/DeepSeek 格式)
 */
async function callDeepSeek(modelName: string, payload: any, config: any) {
    const key = config.DEEPSEEK_API_KEY;
    if (!key) {
        throw new Error("DEEPSEEK_API_KEY 未配置");
    }

    const url = "https://api.deepseek.com/chat/completions";
    console.log(`[DeepSeek Request] URL: ${url}`);

    const openaiMessages: any[] = [];

    // 提取 systemInstruction
    let systemInstruction = "";
    if (payload.systemInstruction) {
        const parts = payload.systemInstruction.parts || [];
        if (parts.length > 0) {
            systemInstruction = parts[0].text || "";
        }
    }
    if (systemInstruction) {
        openaiMessages.push({ role: "system", content: systemInstruction });
    }

    // 提取用户 prompt
    const contents = payload.contents || [];
    if (contents.length > 0) {
        const parts = contents[0].parts || [];
        if (parts.length > 0) {
            const promptText = parts[0].text || "";
            openaiMessages.push({ role: "user", content: promptText || "开始分析图片" });
        }
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            model: modelName === "gemini-3-flash-preview" ? "deepseek-chat" : modelName, 
            messages: openaiMessages,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API Error (${response.status}): ${errorText}`);
    }

    const resJson = await response.json();
    const text = resJson.choices?.[0]?.message?.content || "";
    return {
        candidates: [{
            content: {
                parts: [{ text }]
            }
        }],
        usageMetadata: {
            promptTokenCount: resJson.usage?.prompt_tokens || 0,
            candidatesTokenCount: resJson.usage?.completion_tokens || 0,
            totalTokenCount: resJson.usage?.total_tokens || 0
        }
    };
}

/**
 * 免费谷歌翻译接口（直连官方）
 */
async function googleFreeTranslate(text: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) return text;
    
    let langCode = targetLang;
    if (langCode === 'zh_tw') langCode = 'zh-TW';

    const baseUrl = "https://translate.googleapis.com";
    const maxRetries = 3;
    const url = `${baseUrl}/translate_a/single?client=gtx&sl=auto&tl={langCode}&dt=t`;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const params = new URLSearchParams();
            params.append('q', text);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data[0]) {
                    const translatedText = data[0].map((x: any) => x[0] || '').join('');
                    if (translatedText && translatedText.trim()) {
                        return translatedText.trim();
                    }
                }
            } else {
                console.warn(`[Google Free Translate] Attempt ${attempt + 1} non-200: ${response.status}`);
            }
        } catch (e: any) {
            console.error(`[Google Free Translate] Attempt ${attempt + 1} error: ${e.message}`);
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    throw new Error("Google Free Translate failed after retries.");
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
 * 带有超时、自动重试与 Hybrid 降级的大模型请求分发包装器
 */
async function requestWithRetry<T>(
    modelName: string,
    operation: (model: any) => Promise<T>,
    maxRetries = 2,
    initialDelay = 1000
): Promise<{ result: T; usage?: any; duration: number }> {
    const config = await getAiConfig();
    const startTime = Date.now();
    let lastError: any;

    let currentProvider = config.CHAT_AI_PROVIDER === 'deepseek' ? 'deepseek' : config.AI_PROVIDER;

    if (currentProvider === 'local') {
        console.log("[AI Request] Local mode active, skipping model call.");
        throw new Error("System is in local mode");
    }

    for (let i = 0; i <= maxRetries; i++) {
        try {
            let lastUsage: any = null;
            const mockModel = {
                generateContent: async (payload: any) => {
                    let result: any = null;
                    console.log(`[AI Request Executing] Provider: ${currentProvider}, Model: ${modelName}`);

                    if (currentProvider === 'vertex' || currentProvider === 'easyrouter' || currentProvider === 'hybrid') {
                        result = await callVertexAI(modelName, payload, config);
                    } else if (currentProvider === 'gemini') {
                        result = await callGeminiStudio(modelName, payload, config);
                    } else if (currentProvider === 'deepseek') {
                        result = await callDeepSeek(modelName, payload, config);
                    } else {
                        throw new Error(`未识别的 AI 提供商: ${currentProvider}`);
                    }

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

            const isConfigError = message.includes("401") || message.includes("403") || message.includes("404") ||
                                  message.includes("GCP_SERVICE_ACCOUNT_KEY") || message.includes("GEMINI_API_KEY") ||
                                  message.includes("DEEPSEEK_API_KEY");

            if (isConfigError || message.includes("429")) {
                if (config.AI_PROVIDER === 'hybrid') {
                    console.warn("[AI Client Hybrid] 官方直连异常，触发高可用偏转，自动降级至 EasyRouter 中转通道...");
                    try {
                        config.AI_PROVIDER = 'easyrouter'; 
                        currentProvider = 'easyrouter';
                        
                        let lastUsage: any = null;
                        const mockModel = {
                            generateContent: async (payload: any) => {
                                const result = await callVertexAI(modelName, payload, config);
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
                    } catch (fallbackErr: any) {
                        console.error("[AI Client Hybrid Critical] EasyRouter 降级通道亦调用失败:", fallbackErr.message);
                        throw fallbackErr;
                    } finally {
                        config.AI_PROVIDER = 'hybrid'; 
                    }
                }
                throw error;
            }

            if (i < maxRetries) {
                const delay = initialDelay * Math.pow(2, i) + (Math.random() * 500); 
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            if (config.AI_PROVIDER === 'hybrid') {
                console.warn("[AI Client Hybrid] 所有直连重试全部失败，执行最终的 EasyRouter 降级...");
                try {
                    config.AI_PROVIDER = 'easyrouter';
                    currentProvider = 'easyrouter';
                    
                    let lastUsage: any = null;
                    const mockModel = {
                        generateContent: async (payload: any) => {
                            const result = await callVertexAI(modelName, payload, config);
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
                } catch (fallbackErr: any) {
                    console.error("[AI Client Hybrid Critical] EasyRouter 最终降级失败:", fallbackErr.message);
                } finally {
                    config.AI_PROVIDER = 'hybrid';
                }
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
                let parsedResult = cached.result;
                
                // NOTE: 针对翡翠鉴定与眼诊功能，若缓存数据是字符串类型，则尝试将其反序列化为 JSON 对象，防止前端读取属性失败
                if (action === 'jadeAppraisal' || action === 'eyeDiagnosis') {
                    if (typeof cached.result === 'string') {
                        try {
                            parsedResult = JSON.parse(cached.result);
                        } catch (e) {
                            console.error("[Cache Parse Error] 还原 JSON 缓存失败:", e);
                        }
                    }
                }
                
                return res.status(200).json({ result: parsedResult });
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
                
                // 定义明确的 JSON 结构要求 (完美复制自参考项目)
                const jadeSchema = `{
                    "authenticity": { 
                        "conclusion": "例如：天然翡翠A货 / 经过酸洗充胶处理的B货 / 人造仿冒品 等严谨鉴定结论", 
                        "reasons": ["依据一：表面是否有酸蚀网纹", "依据二：是否有强光反射起荧特征", "依据三：结构松散度与杂质状况"], 
                        "riskLevel": "low|medium|high",
                        "probability": "天然A货可能性百分比，如：98%"
                    },
                    "quality": { 
                        "color": "翡翠的颜色描述，如阳绿、满绿、白底青、无色等", 
                        "transparency": "水头评价，如玻璃种、冰种、冰糯种、细糯种、豆种等", 
                        "texture": "种质特征，如质地细腻紧密、结晶颗粒粗大等", 
                        "craftsmanship": "雕工和整体做工评价", 
                        "overallGrade": "整体品质综合档次评定" 
                    },
                    "valuation": {
                        "priceRange": "估值区间，如：¥12,000 - ¥18,000 元 (AI结合品相估算，仅供参考)",
                        "collectibility": "收藏与佩戴级别，如：日常佩戴级 / 轻度收藏级 / 传家收藏级"
                    },
                    "detailedAnalysis": "Markdown 格式的深度专业分析报告。必须严格、依次包含以下 7 个核心的行业标准检测维度及中英双语小标题。每个小标题前必须加上【### 】作为 Markdown 三级标题且独立占一行，标题前必须包含数字序号（1-7），字数要求在400字以上，排版要优雅工整：\\n\\n### 1. 种水 (Type and Water/Transparency)：\\n[分析样品的种地，如玻璃种/冰种/糯种/豆种等，并评估其透明度（几分水）与晶体细腻致密度]\\n\\n### 2. 色泽 (Color)：\\n[剖析颜色的分布特性，是否具有天然色根与渐变层次，颜色饱和度与是否属于邪色]\\n\\n### 3. 棉絮 (Cotton)：\\n[评估内部絮状物、天然棉絮的多寡、结构形态及其对通透度和美观度的整体影响]\\n\\n### 4. 石纹 (Stone Veins) 与 裂纹 (Cracks)：\\n[严格辨识是否带有天然石纹（无害）或由于外力及加工造成的破坏性微裂隙（有害）]\\n\\n### 5. 瑕疵 (Blemishes)：\\n[分析黑点、脏点、杂质、共生矿物包裹体等多角度微观特征]\\n\\n### 6. 荧光反应 (Fluorescence/Glow) 与 起胶/起光 (Gelatinous/Luster Effect)：\\n[深度探讨在折射/反射光下翡翠表面的起莹（荧）、起胶、刚性光泽表现，以判定内部结构的致密度及有无充胶B货迹象]\\n\\n### 7. 物理特性解释 (Physical Properties Explanation)：\\n[用最专业的矿物物理学原理，例如解释致色元素铬（Cr）和铁（Fe）的均温分布特征、纤维交织结构的透光原理、天然玻璃光泽的硬度（莫氏硬度6.5-7）以及折射率（1.66）表现对成色的内在物理支持。]"
                }`;

                const systemInstruction = isJade 
                    ? `你是一位资深的翡翠珠宝鉴定与评估专家。请严格分析用户上传的多张翡翠图片（可能包括自然光正面照、强光透照、微距起荧照等）。
必须输出一个且仅一个符合以下 JSON 格式要求的 JSON 对象，绝对不要包含任何额外的自然语言废话，且必须使用中文输出内容：\n${jadeSchema}`
                    : `你是一位深谙中医“五轮学说”的资深眼诊望诊专家。用户上传了五张不同角度的眼部自拍照（正视、仰视、俯视、左视、右视）。
请严格依据中医“五轮（肉轮-脾胃、血轮-心、气轮-肺、风轮-肝、水轮-肾）”辩证逻辑，分析眼部的白睛、黑睛、两眦、瞳神以及眼睑等区域的颜色、红丝、斑点、凹凸等生理表现。
必须输出一个且仅一个符合以下 JSON 格式要求的 JSON 对象，绝对不要包含任何额外的自然语言废话，且必须使用 ${targetLangName} 语言输出内容。

JSON 结构规范：
{
  "healthScore": 60到100之间的整数得分,
  "mainFinding": "眼部表现出的最核心的一句脏腑健康状况总结，不超过15个字",
  "visceraStatus": "五脏六腑健康总体辩证结论",
  "detailedAnalysis": {
    "spleenStomach": "脾胃调理（肉轮：眼睑）分析，字数约50字",
    "heart": "心血机能（血轮：眼两眦）分析，字数约50字",
    "lung": "肺气呼吸（气轮：白睛/巩膜）分析，字数约50字",
    "liver": "肝胆疏泄（风轮：黑睛/角膜）分析，字数约50字",
    "kidney": "肾精系统（水轮：瞳神/瞳孔）分析，字数约50字"
  },
  "suggestions": ["日常中医调理建议一", "日常中医调理建议二", "日常中医调理建议三"],
  "reportMarkdown": "Markdown 格式的健康调理建议报告。采用温和鼓励的语气，包含针对生活作息、膳食食疗、穴位按摩以及情志调节等层面的中医调理良方。"
}`;

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

                    let text = response.response.candidates[0].content.parts[0].text || "";
                    console.log(`[${action}] Raw Response Sample: ${text.substring(0, 120)}...`);

                    // 尝试清洗并精准过滤出 JSON
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    const cleanJson = jsonMatch ? jsonMatch[0] : text;

                    try {
                        return JSON.parse(cleanJson);
                    } catch (e) {
                        console.error(`[${action}] JSON Parse Failed:`, e);
                        return { error: "AI 报告解析失败", raw: text };
                    }
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
