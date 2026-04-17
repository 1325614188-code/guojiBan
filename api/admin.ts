import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// 懒加载初始化 Supabase 客户端
function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase configuration (URL or Key). Please check environment variables.");
    }
    
    return createClient(supabaseUrl, supabaseKey);
}

const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password + 'meili_salt_2026').digest('hex');
};

// 默认管理员账号
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'dong2016';

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { action, adminId, ...data } = req.body;
        const supabase = getSupabase();

        // 验证管理员权限
        if (adminId) {
            const { data: admin } = await supabase
                .from('users')
                .select('is_admin')
                .eq('id', adminId)
                .single();

            if (!admin?.is_admin) {
                return res.status(403).json({ error: '无管理员权限' });
            }
        }

        switch (action) {
            case 'initAdmin': {
                // 初始化/重置管理员账户
                const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', ADMIN_USERNAME)
                    .single();

                if (!existing) {
                    await supabase.from('users').insert({
                        username: ADMIN_USERNAME,
                        password_hash: hashPassword(ADMIN_PASSWORD),
                        nickname: '管理员',
                        credits: 9999,
                        is_admin: true
                    });
                } else {
                    // 如果已存在，则重置密码和管理员权限
                    await supabase
                        .from('users')
                        .update({
                            password_hash: hashPassword(ADMIN_PASSWORD),
                            is_admin: true
                        })
                        .eq('username', ADMIN_USERNAME);
                }

                return res.status(200).json({ success: true });
            }

            case 'getUsers': {
                const { page = 1, pageSize = 20 } = data;

                const { data: users, count } = await supabase
                    .from('users')
                    .select('id, username, nickname, credits, points, device_id, created_at, is_admin', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range((page - 1) * pageSize, page * pageSize - 1);

                return res.status(200).json({ users, total: count });
            }

            case 'updateCredits': {
                const { userId, amount } = data;

                await supabase.rpc('add_credits', { user_id: userId, amount });

                const { data: user } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', userId)
                    .single();

                return res.status(200).json({ success: true, newCredits: user?.credits });
            }

            case 'updatePoints': {
                const { userId, amount } = data;

                await supabase.rpc('add_points', { user_id: userId, amount });

                const { data: user } = await supabase
                    .from('users')
                    .select('points')
                    .eq('id', userId)
                    .single();

                return res.status(200).json({ success: true, newPoints: user?.points });
            }

            case 'getConfig': {
                const { data: configs, error } = await supabase
                    .from('app_config')
                    .select('key, value');

                if (error) {
                    console.error('[getConfig Error]', error);
                    return res.status(500).json({ error: `无法加载系统配置: ${error.message}`, code: error.code });
                }

                const configMap: Record<string, string> = {};
                configs?.forEach(c => { configMap[c.key] = c.value; });

                return res.status(200).json({ config: configMap });
            }

            case 'updateConfig': {
                const { key, value } = data;

                const { error } = await supabase
                    .from('app_config')
                    .upsert({ key, value, updated_at: new Date().toISOString() });

                if (error) {
                    console.error('[updateConfig Error]', error);
                    return res.status(500).json({ error: `更新配置失败: ${error.message}`, code: error.code });
                }

                return res.status(200).json({ success: true });
            }

            case 'getStats': {
                const { count: userCount } = await supabase
                    .from('users')
                    .select('id', { count: 'exact', head: true });

                const { count: orderCount } = await supabase
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'paid');

                return res.status(200).json({
                    totalUsers: userCount,
                    totalOrders: orderCount
                });
            }

            case 'getPointRedemptions': {
                // 获取积分兑换申请列表
                const { data: redemptions } = await supabase
                    .from('point_redemptions')
                    .select('*')
                    .order('created_at', { ascending: false });

                return res.status(200).json({ redemptions: redemptions || [] });
            }

            case 'processPointRedemption': {
                const { redemptionId, approved, adminNote } = data;

                // 获取兑换申请
                const { data: redemption } = await supabase
                    .from('point_redemptions')
                    .select('*')
                    .eq('id', redemptionId)
                    .single();

                if (!redemption) {
                    return res.status(404).json({ error: '兑换申请不存在' });
                }

                if (redemption.status !== 'pending') {
                    return res.status(400).json({ error: '该申请已被处理' });
                }

                if (approved) {
                    // 批准：扣除用户积分
                    await supabase.rpc('add_points', {
                        user_id: redemption.user_id,
                        amount: -redemption.points_used
                    });

                    // 更新申请状态
                    await supabase
                        .from('point_redemptions')
                        .update({
                            status: 'approved',
                            processed_at: new Date().toISOString(),
                            admin_note: adminNote || '已批准'
                        })
                        .eq('id', redemptionId);
                } else {
                    // 拒绝：不扣除积分，仅更新状态
                    await supabase
                        .from('point_redemptions')
                        .update({
                            status: 'rejected',
                            processed_at: new Date().toISOString(),
                            admin_note: adminNote || '已拒绝'
                        })
                        .eq('id', redemptionId);
                }

                return res.status(200).json({
                    success: true,
                    message: approved ? '已批准兑换申请' : '已拒绝兑换申请'
                });
            }

            case 'getCommissions': {
                // 获取佣金记录
                const { data: commissions } = await supabase
                    .from('commissions')
                    .select(`
                        id,
                        amount,
                        status,
                        created_at,
                        users:user_id(username, nickname),
                        source:source_user_id(username)
                    `)
                    .order('created_at', { ascending: false });

                return res.status(200).json({ commissions: commissions || [] });
            }

            case 'updateCommission': {
                const { userId, amount } = data;
                await supabase.rpc('add_commission', { user_id: userId, amount });
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

            case 'getConversations': {
                // 获取所有有消息往来的用户列表
                const { data: messages, error } = await supabase
                    .from('support_messages')
                    .select('user_id, users:user_id(username, nickname), content, created_at, sender_type, is_read')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // 按用户 ID 分组，只保留最新的消息
                const conversationsMap = new Map();
                messages?.forEach(msg => {
                    if (!conversationsMap.has(msg.user_id)) {
                        conversationsMap.set(msg.user_id, {
                            user_id: msg.user_id,
                            username: msg.users?.username,
                            nickname: msg.users?.nickname,
                            lastMessage: msg.content,
                            lastTime: msg.created_at,
                            unreadCount: 0
                        });
                    }
                    if (msg.sender_type === 'user' && !msg.is_read) {
                        conversationsMap.get(msg.user_id).unreadCount++;
                    }
                });

                return res.status(200).json({ conversations: Array.from(conversationsMap.values()) });
            }

            case 'getConversationMessages': {
                const { userId } = data;
                const { data: messages, error } = await supabase
                    .from('support_messages')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                return res.status(200).json({ messages });
            }

            case 'replySupportMessage': {
                const { userId, content } = data;
                const { data: message, error } = await supabase
                    .from('support_messages')
                    .insert({
                        user_id: userId,
                        sender_type: 'admin',
                        content,
                        is_read: false
                    })
                    .select()
                    .single();

                if (error) throw error;
                return res.status(200).json({ success: true, message });
            }

            case 'markAdminMessageRead': {
                const { userId } = data;
                const { error } = await supabase
                    .from('support_messages')
                    .update({ is_read: true })
                    .eq('user_id', userId)
                    .eq('sender_type', 'user')
                    .eq('is_read', false);

                if (error) throw error;
                return res.status(200).json({ success: true });
            }

            case 'getAIUsage': {
                // 1. 获取汇总统计
                const { data: logs, error: statsError } = await supabase
                    .from('gemini_usage_logs')
                    .select('model_id, prompt_tokens, completion_tokens, total_tokens')
                    .eq('status', 'success');

                if (statsError) throw statsError;

                const stats: Record<string, any> = {};
                logs?.forEach(log => {
                    const model = log.model_id;
                    if (!stats[model]) {
                        stats[model] = {
                            model_id: model,
                            usage_count: 0,
                            prompt_tokens: 0,
                            completion_tokens: 0,
                            total_tokens: 0
                        };
                    }
                    stats[model].usage_count += 1;
                    stats[model].prompt_tokens += (log.prompt_tokens || 0);
                    stats[model].completion_tokens += (log.completion_tokens || 0);
                    stats[model].total_tokens += (log.total_tokens || 0);
                });

                // 2. 获取最近 50 条详细日志
                const { data: recentLogs, error: logError } = await supabase
                    .from('gemini_usage_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (logError) throw logError;

                return res.status(200).json({ 
                    stats: Object.values(stats),
                    recentLogs: recentLogs || []
                });
            }

            case 'getAIStats': {
                // 获取最近 7 天的 AI 使用统计
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const { data: logs } = await supabase
                    .from('gemini_usage_logs')
                    .select('*')
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: false });

                // 计算统计数据
                const stats = {
                    totalRequests: logs?.length || 0,
                    successRequests: logs?.filter(l => l.status === 'success').length || 0,
                    errorRequests: logs?.filter(l => l.status === 'error').length || 0,
                    totalTokens: logs?.reduce((acc, l) => acc + (l.total_tokens || 0), 0) || 0,
                    byModel: {} as Record<string, number>,
                    byAction: {} as Record<string, number>,
                    dailyTokens: {} as Record<string, number>
                };

                logs?.forEach(log => {
                    stats.byModel[log.model_id] = (stats.byModel[log.model_id] || 0) + 1;
                    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
                    
                    const day = new Date(log.created_at).toLocaleDateString();
                    stats.dailyTokens[day] = (stats.dailyTokens[day] || 0) + (log.total_tokens || 0);
                });

                return res.status(200).json(stats);
            }

            case 'cleanupMessages': {
                // 清理 3 个月前（90天）的旧消息
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

                const { error, count } = await supabase
                    .from('support_messages')
                    .delete({ count: 'exact' })
                    .lt('created_at', threeMonthsAgo.toISOString());

                if (error) throw error;
                return res.status(200).json({ success: true, count });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('[Admin Error]', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
