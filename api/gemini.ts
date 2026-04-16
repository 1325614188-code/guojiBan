import { GoogleAuth } from 'google-auth-library';
import { astro } from 'iztro';
import { createClient } from '@supabase/supabase-js';

// NOTE: 纯净 Vertex AI 后端实现
// 目的：仅使用 Google Cloud Vertex AI，确保消耗赠金账户。
// 移除所有 Gemini API (AI Studio) 的 Key 与调用逻辑。

/**
 * 环境变量配置
 */
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || "";
const GCP_LOCATION = process.env.GCP_LOCATION || "us-central1";
const GCP_KEY_STR = process.env.GCP_SERVICE_ACCOUNT_KEY || "";

/**
 * 模型配置 - 统一使用 Vertex AI 标准 ID
 */
const MODELS = {
    FLASH: "gemini-1.5-flash-001",
    PRO: "gemini-1.5-pro-001",
    // 换装和发型暂时也指向 Flash 确保基础调用连通
    IMAGE_GEN: "gemini-1.5-flash-001" 
};

/**
 * 初始化 Supabase (即使不用于 AI 切换，也保留用于其他业务逻辑)
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Vertex AI 客户端封装
 */
class VertexAIClient {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    /**
     * 获取 GCP Access Token (带缓存逻辑)
     */
    private async getAccessToken(): Promise<string> {
        const now = Date.now();
        if (this.accessToken && now < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!GCP_KEY_STR || !GCP_PROJECT_ID) {
            throw new Error("GCP 认证配置不完整 (GCP_SERVICE_ACCOUNT_KEY 或 GCP_PROJECT_ID 缺失)");
        }

        try {
            let sanitizedKey = GCP_KEY_STR.trim();
            // 兼容 Vercel/Docker 环境变量格式
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
            
            this.accessToken = tokenResponse.token || "";
            // 令牌通常 1 小时有效，我们缓存 50 分钟
            this.tokenExpiry = now + 50 * 60 * 1000;
            
            return this.accessToken;
        } catch (e: any) {
            console.error("[VertexAI Auth Error] 获取 Access Token 失败:", e.message);
            throw new Error(`认证失败: ${e.message}`);
        }
    }

    /**
     * 调用 Vertex AI generateContent 接口
     */
    /**
     * 调用 Vertex AI generateContent 接口 (带路径探测)
     */
    async generateContent(modelId: string, payload: any) {
        const token = await this.getAccessToken();
        
        // 探测路径列表
        const regions = [GCP_LOCATION, "global", "us-central1"];
        const versions = ["v1", "v1beta1"];
        const ids = [modelId, "gemini-1.5-flash-001", "gemini-1.5-flash"];
        
        // 去重
        const uniqueRegions = [...new Set(regions)].filter(Boolean);
        const uniqueIds = [...new Set(ids)].filter(Boolean);

        let lastError: any = null;

        for (const region of uniqueRegions) {
            for (const version of versions) {
                for (const id of uniqueIds) {
                    const url = `https://${region === 'global' ? '' : region + '-'}aiplatform.googleapis.com/${version}/projects/${GCP_PROJECT_ID}/locations/${region}/publishers/google/models/${id}:generateContent`;
                    
                    try {
                        console.log(`[Vertex AI Probe] Trying URL: ${url}`);
                        const response = await fetch(url.replace('https://-', 'https://'), {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(payload),
                        });

                        if (response.ok) {
                            console.log(`[Vertex AI Success] Successful Path: ${url}`);
                            return await response.json();
                        }

                        const errorText = await response.text();
                        if (response.status === 404) {
                            console.warn(`[Vertex AI 404] Path failed: ${url}`);
                            lastError = new Error(`Vertex AI 404: ${errorText}`);
                            continue; // 尝试下一个路径
                        }

                        // 如果是 404 以外的错误 (如 403, 429)，直接抛出，不再探测路径
                        console.error(`[Vertex AI API Error] ${response.status} on ${url}:`, errorText);
                        throw new Error(`Vertex AI API Error (${response.status}): ${errorText}`);
                    } catch (e: any) {
                        if (e.message.includes("404")) continue;
                        throw e;
                    }
                }
            }
        }
        
        throw lastError || new Error("Vertex AI 所有路径均返回 404，请确认模型是否已在 GCP 控制台启用。");
    }
}

const vertexClient = new VertexAIClient();

/**
 * 辅助函数：处理请求重试
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            lastError = e;
            if (e.message.includes("429") || e.message.includes("Too Many Requests")) {
                console.warn(`[Retry] 遇到频控，稍后重试 (${i + 1}/${retries})...`);
                await new Promise(r => setTimeout(r, 2000 * (i + 1)));
                continue;
            }
            throw e; // 非频控错误直接抛出
        }
    }
    throw lastError;
}

/**
 * Vercel Serverless Function 主入口
 */
export default async function handler(req: any, res: any) {
    // 跨域设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { action, lang = 'zh-CN', ...params } = req.body;

        // 语言输出映射
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
        const targetLang = langMap[lang] || 'Simplified Chinese';

        console.log(`[API Action Handler] Starting action: ${action}, Lang: ${targetLang}`);

        switch (action) {
            case 'detectPhotoContent': {
                const { image } = params;
                const result = await withRetry(async () => {
                    const payload = {
                        contents: [{
                            role: 'user',
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] || image } },
                                { text: "这张图是否符合：包含人脸且包含足以试穿衣服的上半身？回复 TRUE 或 FALSE。" }
                            ]
                        }],
                        systemInstruction: { parts: [{ text: "你是一个图像合规审计专家。判断图片是否包含清晰人脸及足以试穿衣服的上半身。仅回复一个单词：TRUE 或 FALSE。" }] }
                    };
                    const data = await vertexClient.generateContent(MODELS.FLASH, payload);
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    return text.toUpperCase().includes('TRUE');
                });
                return res.status(200).json({ valid: result });
            }

            case 'analyze': {
                const { type, images, gender } = params;
                const isFengShui = type === '摆设风水分析';
                const isBeautyScore = type === '颜值打分';

                const prompt = `分析类型：${type}。${gender ? `性别：${gender}` : ''}。请使用 ${targetLang} 输出报告。`;
                const systemInstruction = `你是一位资深${isFengShui ? '风水命理大师' : '美化生活博主'}，语气采用典型的小红书风格。必须使用 ${targetLang} 排版优美，带有emoji。${isBeautyScore ? '第一行必须是 [SCORE:XX分]。' : ''}`;

                const result = await withRetry(async () => {
                    const payload = {
                        contents: [{
                            role: 'user',
                            parts: [
                                ...images.map((img: string) => ({
                                    inlineData: { mimeType: 'image/jpeg', data: img.split(',')[1] || img }
                                })),
                                { text: prompt }
                            ]
                        }],
                        systemInstruction: { parts: [{ text: systemInstruction }] }
                    };
                    const data = await vertexClient.generateContent(MODELS.PRO, payload);
                    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                });
                return res.status(200).json({ result });
            }

            case 'tryOn':
            case 'hairstyle':
            case 'makeup': {
                const { itemType, baseImage, itemImage, faceImage, action: currentAction } = req.body;
                let prompt = "";
                let imageData = "";

                if (currentAction === 'tryOn') {
                    prompt = itemType === 'clothes' ? "将图中人物的衣服换成另一张图中的款式。" : "为图中人物戴上耳坠。";
                    imageData = baseImage;
                    // TODO: 实际上 Gemini 1.5 并不支持直接图像生成，这里保留原始逻辑结构
                    // 如需真实生成，应集成 Imagen 3 或专门的 Try-on 模型
                } else {
                    const { hairstyleName, hairstyleDesc, styleName, styleDesc } = req.body;
                    const name = currentAction === 'hairstyle' ? hairstyleName : styleName;
                    const desc = currentAction === 'hairstyle' ? hairstyleDesc : styleDesc;
                    prompt = `为图中人物生成发型/妆容: ${name}。特点: ${desc}。`;
                    imageData = faceImage;
                }

                const result = await withRetry(async () => {
                    const payload = {
                        contents: [{
                            role: 'user',
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] || imageData } },
                                ...(itemImage ? [{ inlineData: { mimeType: 'image/jpeg', data: itemImage.split(',')[1] } }] : []),
                                { text: `${prompt} 请返回修改后的图像。` }
                            ]
                        }]
                    };
                    const data = await vertexClient.generateContent(MODELS.IMAGE_GEN, payload);
                    // 检查是否有返回的图像附件 (Vertex AI 某些版本支持多模态输出)
                    const parts = data.candidates?.[0]?.content?.parts || [];
                    for (const part of parts) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    console.warn(`[Vertex AI] 模型 ${MODELS.IMAGE_GEN} 未返回 inlineData 图像数据`);
                    return null;
                });
                return res.status(200).json({ result });
            }

            case 'ziweiAnalysis': {
                const { birthInfo, gender } = params;
                const match = birthInfo.match(/(\d+)年(\d+)月(\d+)日\s+(\d+):(\d+)/);
                if (!match) return res.status(400).json({ error: '日期格式错误' });

                const [_, y, m, d, h] = match;
                try {
                    // 紫微排盘 (Node.js 专用库)
                    const chart = astro.bySolar(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, parseInt(h), gender, true, 'zh-CN');
                    const payloadData = {
                        basic: { gender: chart.gender, solarDate: chart.solarDate, chineseZodiac: chart.chineseZodiac },
                        palaces: chart.palaces.map(p => ({
                            name: p.name,
                            isLifePalace: p.isLifePalace,
                            majorStars: p.majorStars?.map(s => s.name) || []
                        }))
                    };

                    const systemInstruction = `你是一位精通紫微斗数的命理大师，请根据星盘数据使用 ${targetLang} 生成小红书风格的分析报告。`;
                    const prompt = `星盘数据：${JSON.stringify(payloadData)}`;

                    const result = await withRetry(async () => {
                        const payload = {
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            systemInstruction: { parts: [{ text: systemInstruction }] }
                        };
                        const data = await vertexClient.generateContent(MODELS.PRO, payload);
                        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    });
                    return res.status(200).json({ result });
                } catch (e: any) {
                    return res.status(500).json({ error: `排盘失败: ${e.message}` });
                }
            }

            case 'textAnalysis':
            case 'marriageAnalysis':
            case 'wealthAnalysis': {
                const { prompt: userPrompt, birthInfo, gender: userGender } = params;
                const finalPrompt = userPrompt || `${action === 'marriageAnalysis' ? '婚姻' : '财运'}分析。信息：${birthInfo}，性别：${userGender}`;
                
                const result = await withRetry(async () => {
                    const payload = {
                        contents: [{ role: 'user', parts: [{ text: `${finalPrompt}\n请使用 ${targetLang} 回复。` }] }],
                        systemInstruction: { parts: [{ text: `你是一位命理专家，请使用 ${targetLang} 以小红书风格回复。` }] }
                    };
                    const data = await vertexClient.generateContent(MODELS.FLASH, payload);
                    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                });
                return res.status(200).json({ result });
            }

            case 'jadeAppraisal':
            case 'eyeDiagnosis': {
                const { images } = params;
                const isJade = action === 'jadeAppraisal';
                const systemInstruction = `你是一位${isJade ? '翡翠珠宝鉴定' : '中医望诊'}专家。分析图片并返回合规的 JSON 报告。必须使用 ${targetLang}。`;

                const result = await withRetry(async () => {
                    const payload = {
                        contents: [{
                            role: 'user',
                            parts: [
                                ...images.map((img: string) => ({
                                    inlineData: { mimeType: 'image/jpeg', data: img.includes(',') ? img.split(',')[1] : img }
                                })),
                                { text: "请开始分析并返回 JSON 报告。" }
                            ]
                        }],
                        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
                        systemInstruction: { parts: [{ text: systemInstruction }] }
                    };
                    const data = await vertexClient.generateContent(MODELS.FLASH, payload);
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                    try {
                        return JSON.parse(text);
                    } catch {
                        const match = text.match(/\{[\s\S]*\}/);
                        return match ? JSON.parse(match[0]) : { error: "JSON 解析失败", raw: text };
                    }
                });
                return res.status(200).json({ result });
            }

            default:
                return res.status(400).json({ error: `未知的 Action: ${action}` });
        }
    } catch (error: any) {
        console.error(`[API Handler Error]`, error.message);
        return res.status(500).json({ error: error.message || '内部服务器错误' });
    }
}
