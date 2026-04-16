import { createClient } from '@supabase/supabase-js';

// 懒加载初始化 Supabase 客户端
function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase configuration (URL or Key). Please check environment variables.");
    }
    
    return createClient(supabaseUrl, supabaseKey);
}

// 谷歌免费翻译引擎函数 (对齐主站 logic)
async function translateText(text: string, targetLang: string): Promise<string> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t`;
    
    // 重试逻辑 (Retry logic)
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ q: text }).toString()
            });

            if (!response.ok) {
                console.warn(`[Translate Retry ${i}] ${targetLang} status: ${response.status}`);
                if (i < 2) await new Promise(r => setTimeout(r, 500)); // 缩短重试延迟
                continue;
            }

            const json = await response.json();
            let translatedText = '';
            if (json && json[0]) {
                json[0].forEach((t: any) => {
                    if (t[0]) translatedText += t[0];
                });
            }
            return translatedText || text;
        } catch (e) {
            console.error(`[Translate Error ${i}] ${targetLang}:`, e);
            if (i < 2) await new Promise(r => setTimeout(r, 500));
        }
    }
    return text; // 最终失败时回退到原文本
}

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const methodData = { ...req.query, ...(req.method === 'POST' ? req.body : {}) };
        const { action, ...data } = methodData;
        const supabase = getSupabase();

        switch (action) {
            case 'getPublicLinks': {
                const { data: links, error } = await supabase
                    .from('linktree_links')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return res.status(200).json({ success: true, links: links || [] });
            }

            case 'logVisit': {
                const { linkId } = data;
                if (!linkId) return res.status(400).json({ error: 'Missing linkId' });

                const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
                const country = req.headers['x-vercel-ip-country'] || 'unknown';

                const { error } = await supabase
                    .from('linktree_visits')
                    .insert({
                        link_id: linkId,
                        ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown',
                        country: country
                    });

                if (error) console.error('[Linktree Log Visit Error]', error);
                return res.status(200).json({ success: true });
            }

            case 'getAdminLinks': {
                const { isAdmin } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

                const { data: links, error } = await supabase
                    .from('linktree_links')
                    .select('*')
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return res.status(200).json({ success: true, links: links || [] });
            }

            case 'addLink': {
                const { isAdmin, title, url, logo_url, is_active, sort_order, translations } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

                const { data: newLink, error } = await supabase
                    .from('linktree_links')
                    .insert({ title, url, logo_url, is_active, sort_order, translations: translations || {} })
                    .select()
                    .single();

                if (error) throw error;
                return res.status(200).json({ success: true, link: newLink });
            }

            case 'updateLink': {
                const { isAdmin, linkId, title, url, logo_url, is_active, sort_order, translations } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

                const { error } = await supabase
                    .from('linktree_links')
                    .update({ title, url, logo_url, is_active, sort_order, translations: translations || {} })
                    .eq('id', linkId);

                if (error) throw error;
                return res.status(200).json({ success: true });
            }

            case 'deleteLink': {
                const { isAdmin, linkId } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

                const { error } = await supabase
                    .from('linktree_links')
                    .delete()
                    .eq('id', linkId);

                if (error) throw error;
                return res.status(200).json({ success: true });
            }

            case 'translateTitles': {
                const { isAdmin, title } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });
                if (!title) return res.status(400).json({ error: 'Missing title' });

                const targetLocales = ['en', 'vi', 'ja', 'ko', 'th', 'fr', 'es', 'de', 'zh-TW'];
                const translations: Record<string, string> = {};

                // 改为串行处理，防止 Google API 频率限制 (429)
                for (const locale of targetLocales) {
                    try {
                        translations[locale] = await translateText(title, locale);
                        // 微小冷却，保证安全，设置 100ms 既能防频发又能避免 Vercel 超时
                        await new Promise(r => setTimeout(r, 100));
                    } catch (err) {
                        console.error(`[Translate Loop Error] ${locale}:`, err);
                        translations[locale] = title; // 降级处理
                    }
                }

                return res.status(200).json({ success: true, translations });
            }

            case 'getStats': {
                const { isAdmin } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

                const { data: visits, error, count } = await supabase
                    .from('linktree_visits')
                    .select('link_id, ip_address, country, created_at', { count: 'exact' })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return res.status(200).json({ success: true, visits: visits || [], total: count || 0 });
            }

            case 'getPublicBanners': {
                const { data: banners, error } = await supabase
                    .from('linktree_banners')
                    .select('*')
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return res.status(200).json({ success: true, banners: banners || [] });
            }

            case 'getAdminBanners': {
                const { isAdmin } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

                const { data: banners, error } = await supabase
                    .from('linktree_banners')
                    .select('*')
                    .order('sort_order', { ascending: true })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return res.status(200).json({ success: true, banners: banners || [] });
            }

            case 'addBanner': {
                const { isAdmin, image_url, sort_order } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

                const { data: newBanner, error } = await supabase
                    .from('linktree_banners')
                    .insert({ image_url, sort_order: sort_order || 0 })
                    .select()
                    .single();

                if (error) throw error;
                return res.status(200).json({ success: true, banner: newBanner });
            }

            case 'deleteBanner': {
                const { isAdmin, bannerId } = data;
                if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

                const { error } = await supabase
                    .from('linktree_banners')
                    .delete()
                    .eq('id', bannerId);

                if (error) throw error;
                return res.status(200).json({ success: true });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('[Linktree API Error]', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
