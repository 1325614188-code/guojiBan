import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '../lib/api-config';
import LinktreeAdmin from '../components/admin/LinktreeAdmin';

interface AdminViewProps {
    admin: any;
    onBack: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ admin, onBack }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [config, setConfig] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0 });
    const [editingCredits, setEditingCredits] = useState<{ id: string; amount: number; original: number } | null>(null);
    const [editingPoints, setEditingPoints] = useState<{ id: string; amount: number; original: number } | null>(null);
    const [pointRedemptions, setPointRedemptions] = useState<any[]>([]);
    const [commissions, setCommissions] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'commissions' | 'withdrawals' | 'config' | 'linktree' | 'support' | 'ai'>('users');
    const [cBoard, setCBoard] = useState<any[]>(Array(20).fill({ user: '', amount: '' }));
    const [pBoard, setPBoard] = useState<any[]>(Array(20).fill({ user: '', amount: '' }));
    const [aiUsage, setAiUsage] = useState<any[]>([]);
    const [recentAiLogs, setRecentAiLogs] = useState<any[]>([]);

    // 客服支持状态
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [supportMessages, setSupportMessages] = useState<any[]>([]);
    const [replyInput, setReplyInput] = useState('');
    const [replySending, setReplySending] = useState(false);
    const [adminTranslated, setAdminTranslated] = useState<Record<string, string>>({});
    const [adminTranslatingId, setAdminTranslatingId] = useState<string | null>(null);
    const supportEndRef = useRef<HTMLDivElement>(null);
    const supportPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 随机数据生成器
    const generateRandomData = (type: 'commission' | 'points') => {
        const prefixes = ['user', 'vip', 'member', 'beauty', 'star', 'lucky', 'pro', 'meili', 'app', 'win', 'cool', 'fast', 'top', 'pure', 'gold', 'silver', 'spark', 'joy', 'flow', 'wave'];
        const data = Array.from({ length: 20 }, (_, i) => ({
            user: prefixes[Math.floor(Math.random() * prefixes.length)] + (Math.floor(Math.random() * 900) + 100),
            amount: type === 'commission' 
                ? Math.floor(Math.random() * 500 + 100).toString() 
                : ([20, 50, 40, 60, 80, 100, 150, 200, 250][Math.floor(Math.random() * 9)]).toString()
        }));
        if (type === 'commission') setCBoard(data);
        else setPBoard(data);
        return data;
    };

    // 排行榜数据解析辅助
    const parseLeaderboard = (data?: string) => {
        try {
            if (!data) return Array(20).fill({ user: '', amount: '' });
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return Array(20).fill({ user: '', amount: '' });
            // 补齐到 20 行
            const full = [...parsed];
            while (full.length < 20) full.push({ user: '', amount: '' });
            return full.slice(0, 20);
        } catch (e) {
            return Array(20).fill({ user: '', amount: '' });
        }
    };

    // 加载数据
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 初始化管理员
            await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'initAdmin' })
            });

            // 获取用户列表
            const usersRes = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getUsers', adminId: admin.id })
            });
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);

            // 获取配置
            const configRes = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getConfig', adminId: admin.id })
            });
            const configData = await configRes.json();
            setConfig(configData.config || {});

            // 初始化本地榜单数据
            if (configData.config?.commission_leaderboard_data) {
                setCBoard(parseLeaderboard(configData.config.commission_leaderboard_data));
            }
            if (configData.config?.points_leaderboard_data) {
                setPBoard(parseLeaderboard(configData.config.points_leaderboard_data));
            }

            // 获取统计
            const statsRes = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getStats', adminId: admin.id })
            });
            const statsData = await statsRes.json();
            setStats(statsData);

            // 获取积分兑换申请
            const redemptionsRes = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getPointRedemptions', adminId: admin.id })
            });
            const redemptionsData = await redemptionsRes.json();
            setPointRedemptions(redemptionsData.redemptions || []);

            // 获取佣金记录
            const commissionsRes = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getCommissions', adminId: admin.id })
            });
            const commissionsData = await commissionsRes.json();
            setCommissions(commissionsData.commissions || []);

            // 获取佣金提现申请
            const withdrawalsRes = await fetch(getApiUrl('/api/auth_v2'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getWithdrawalList', isAdmin: true })
            });
            const withdrawalsData = await withdrawalsRes.json();
            setWithdrawals(withdrawalsData.list || []);

            // 获取 AI 使用统计
            const aiRes = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getAIUsage', adminId: admin.id })
            });
            const aiData = await aiRes.json();
            setAiUsage(aiData.stats || []);
            setRecentAiLogs(aiData.recentLogs || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // 更新配置
    const updateConfig = async (key: string, value: string) => {
        try {
            await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateConfig', adminId: admin.id, key, value })
            });
            setConfig({ ...config, [key]: value });
        } catch (e) {
            console.error(e);
        }
    };

    // 更新用户额度
    const updateCredits = async (userId: string, amount: number) => {
        try {
            await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateCredits', adminId: admin.id, userId, amount })
            });
            setEditingCredits(null);
            loadData();
        } catch (e) {
            console.error(e);
        }
    };

    // 更新用户积分
    const updatePoints = async (userId: string, amount: number) => {
        try {
            await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updatePoints', adminId: admin.id, userId, amount })
            });
            setEditingPoints(null);
            loadData();
        } catch (e) {
            console.error(e);
        }
    };

    // 处理积分兑换申请
    const processRedemption = async (redemptionId: string, approved: boolean) => {
        setProcessingId(redemptionId);
        try {
            await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'processPointRedemption',
                    adminId: admin.id,
                    redemptionId,
                    approved
                })
            });
            loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setProcessingId(null);
        }
    };

    // 处理提现申请
    const handleProcessWithdrawal = async (withdrawalId: string, status: 'approved' | 'rejected') => {
        if (!confirm(`确认要${status === 'approved' ? '批准并标记为已兑付' : '拒绝'}这笔提现申请吗？`)) return;

        setProcessingId(withdrawalId);
        try {
            const res = await fetch(getApiUrl('/api/auth_v2'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'processWithdrawal',
                    isAdmin: true,
                    withdrawalId,
                    status,
                    adminNote: status === 'approved' ? '管理员已线下兑付' : '不符合提现要求'
                })
            });
            if (res.ok) {
                alert('处理成功');
                loadData();
            } else {
                const data = await res.json();
                alert('处理失败: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('请求异常');
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * 加载所有客服会话列表
     */
    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getConversations', adminId: admin.id })
            });
            const data = await res.json();
            if (data.conversations) setConversations(data.conversations);
        } catch (e) {
            console.error('[Support] Load conversations failed:', e);
        }
    }, [admin.id]);

    /**
     * 加载指定用户的聊天消息
     */
    const loadConversationMessages = useCallback(async (userId: string) => {
        try {
            const res = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getConversationMessages', adminId: admin.id, userId })
            });
            const data = await res.json();
            if (data.messages) setSupportMessages(data.messages);
        } catch (e) {
            console.error('[Support] Load messages failed:', e);
        }
    }, [admin.id]);

    /**
     * 一键清理 3 个月前的客服消息
     */
    const handleCleanupMessages = async () => {
        if (!confirm('确认要清理 3 个月前的所有客服对话历史吗？此操作不可逆！')) return;
        
        try {
            const res = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cleanupMessages', adminId: admin.id })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`清理完毕！共删除了 ${data.count || 0} 条消息记录。`);
                loadConversations();
            } else {
                alert('清理失败: ' + data.error);
            }
        } catch (e) {
            console.error('[Support] Cleanup failed:', e);
            alert('清理过程中发生错误');
        }
    };

    // 切换到客服标签时加载会话列表并开启轮询
    useEffect(() => {
        if (activeTab === 'support') {
            loadConversations();
            supportPollRef.current = setInterval(() => {
                loadConversations();
                if (selectedUserId) loadConversationMessages(selectedUserId);
            }, 5000);
        }
        return () => {
            if (supportPollRef.current) clearInterval(supportPollRef.current);
        };
    }, [activeTab, selectedUserId, loadConversations, loadConversationMessages]);

    // 选择用户时加载消息并标记已读
    useEffect(() => {
        if (selectedUserId) {
            loadConversationMessages(selectedUserId);
            // 标记该用户消息已读
            fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAdminMessageRead', adminId: admin.id, userId: selectedUserId })
            });
        }
    }, [selectedUserId, loadConversationMessages, admin.id]);

    // 消息自动滚动
    useEffect(() => {
        supportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [supportMessages]);

    /**
     * 管理员回复消息
     */
    const handleSupportReply = async () => {
        if (!replyInput.trim() || !selectedUserId || replySending) return;
        setReplySending(true);
        try {
            const res = await fetch(getApiUrl('/api/admin'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'replySupportMessage', adminId: admin.id, userId: selectedUserId, content: replyInput.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setReplyInput('');
                loadConversationMessages(selectedUserId);
            }
        } catch (e) {
            console.error('[Support] Reply failed:', e);
        } finally {
            setReplySending(false);
        }
    };

    /**
     * 管理端消息翻译（翻译为中文）
     */
    const handleAdminTranslate = async (msgId: string, text: string) => {
        if (adminTranslated[msgId]) {
            setAdminTranslated(prev => { const n = { ...prev }; delete n[msgId]; return n; });
            return;
        }
        setAdminTranslatingId(msgId);
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            const data = await res.json();
            const translated = data[0]?.map((item: any) => item[0]).join('') || text;
            setAdminTranslated(prev => ({ ...prev, [msgId]: translated }));
        } catch (e) {
            console.error('[Translate] Failed:', e);
        } finally {
            setAdminTranslatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex bg-slate-50 text-slate-800 font-sans overflow-hidden">
            {/* 左侧侧边栏 Sidebar (固定宽 260px) */}
            <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 shadow-xl relative z-20">
                {/* LOGO */}
                <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
                    <span className="text-2xl">🧪</span>
                    <div>
                        <h1 className="font-black text-sm tracking-widest text-pink-500 uppercase">美力实验室</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">系统管理平台</p>
                    </div>
                </div>

                {/* 垂直菜单 */}
                <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'users'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/10'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                        <span className="text-base">👥</span>
                        <span>用户管理</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('commissions')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'commissions'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/10'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                        <span className="text-base">💰</span>
                        <span>推广流水</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('withdrawals')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'withdrawals'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/10'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                        <span className="text-base">🏧</span>
                        <span>提现审批</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'config'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/10'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                        <span className="text-base">⚙️</span>
                        <span>系统配置</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('linktree')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'linktree'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/10'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                        <span className="text-base">🔗</span>
                        <span>导航链接</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'support'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/10'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-base">💬</span>
                            <span>客服工作台</span>
                        </div>
                        {conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                                {conversations.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0)}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'ai'
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/10'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                        <span className="text-base">🤖</span>
                        <span>AI 用量日志</span>
                    </button>
                </div>

                {/* 侧边栏底部 */}
                <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950">
                    <button
                        onClick={onBack}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>🏠</span> 返回前台首页
                    </button>
                </div>
            </div>

            {/* 右侧主工作区 */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Topbar */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-sm relative z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm font-medium">当前位置 /</span>
                        <span className="text-slate-800 text-sm font-bold">
                            {activeTab === 'users' && '👥 用户管理'}
                            {activeTab === 'commissions' && '💰 推广流水'}
                            {activeTab === 'withdrawals' && '🏧 提现审批'}
                            {activeTab === 'config' && '⚙️ 系统配置'}
                            {activeTab === 'linktree' && '🔗 导航链接'}
                            {activeTab === 'support' && '💬 客服工作台'}
                            {activeTab === 'ai' && '🤖 AI 用量日志'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 border px-3.5 py-1.5 rounded-xl text-xs text-slate-600 font-semibold shadow-inner">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>管理员: {admin.nickname || admin.username}</span>
                        </div>
                        <button
                            onClick={onBack}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md shadow-pink-500/10 transition-all active:scale-95"
                        >
                            返回前台
                        </button>
                    </div>
                </header>

                {/* 核心内容滚动区 */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* 数据看板 (只在非客服、非链接树 Tab 下常驻展示) */}
                    {activeTab !== 'support' && activeTab !== 'linktree' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-3xl p-6 border shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">系统注册用户</div>
                                <div className="text-3xl font-black text-slate-800 tracking-tight mt-2">{stats.totalUsers}</div>
                                <div className="absolute top-4 right-4 text-2xl opacity-20">👥</div>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">付费订单总数</div>
                                <div className="text-3xl font-black text-slate-800 tracking-tight mt-2">{stats.totalOrders}</div>
                                <div className="absolute top-4 right-4 text-2xl opacity-20">💳</div>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">今日 AI 测算</div>
                                <div className="text-3xl font-black text-slate-800 tracking-tight mt-2">
                                    {aiUsage.reduce((acc, curr) => acc + curr.usage_count, 0)}
                                </div>
                                <div className="absolute top-4 right-4 text-2xl opacity-20">🤖</div>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">当前 AI 模型服务商</div>
                                <div className="text-3xl font-black text-slate-800 tracking-tight mt-2 capitalize">
                                    {config.ai_provider || 'Gemini'}
                                </div>
                                <div className="absolute top-4 right-4 text-2xl opacity-20">🛡️</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* 积分兑换申请 */}
                            {pointRedemptions.filter(r => r.status === 'pending').length > 0 && (
                                <div className="bg-white rounded-3xl p-6 border shadow-sm">
                                    <h3 className="font-bold mb-4 text-pink-500 flex items-center gap-2">🌟 积分兑换申请 ({pointRedemptions.filter(r => r.status === 'pending').length})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {pointRedemptions.filter(r => r.status === 'pending').map(redemption => (
                                            <div key={redemption.id} className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                                                <div>
                                                    <p className="font-bold text-sm">@{redemption.username || redemption.user_id}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {redemption.points_used}积分 → <span className="text-pink-500 font-bold">{redemption.reward_amount}元红包</span>
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => processRedemption(redemption.id, true)}
                                                        disabled={processingId === redemption.id}
                                                        className="px-3.5 py-1.5 bg-green-500 text-white rounded-xl text-xs font-bold shadow-md shadow-green-500/10 active:scale-95 transition-all"
                                                    >
                                                        {processingId === redemption.id ? '...' : '批准'}
                                                    </button>
                                                    <button
                                                        onClick={() => processRedemption(redemption.id, false)}
                                                        disabled={processingId === redemption.id}
                                                        className="px-3.5 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/10 active:scale-95 transition-all"
                                                    >
                                                        拒绝
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 用户列表 */}
                            <div className="bg-white rounded-3xl p-6 border shadow-sm">
                                <h3 className="font-bold mb-4">👥 用户管理</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 border-b pb-4">
                                                <th className="pb-3 font-semibold">用户名</th>
                                                <th className="pb-3 font-semibold text-nowrap">额度</th>
                                                <th className="pb-3 font-semibold text-nowrap">积分</th>
                                                <th className="pb-3 font-semibold text-nowrap">收益</th>
                                                <th className="pb-3 font-semibold">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4">
                                                        <div className="font-bold text-slate-800">{u.nickname || '未命名'}</div>
                                                        <div className="text-[11px] text-gray-400">@{u.username}</div>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="cursor-pointer min-h-[1.75rem] flex items-center">
                                                            {editingCredits?.id === u.id ? (
                                                                <input
                                                                    autoFocus
                                                                    type="number"
                                                                    value={editingCredits.amount}
                                                                    onClick={e => e.stopPropagation()}
                                                                    onChange={e => setEditingCredits({ ...editingCredits, amount: parseInt(e.target.value) || 0 })}
                                                                    onBlur={() => {
                                                                        const diff = editingCredits.amount - editingCredits.original;
                                                                        if (diff !== 0) updateCredits(u.id, diff);
                                                                        else setEditingCredits(null);
                                                                    }}
                                                                    className="w-16 h-7 px-1.5 rounded-lg border-2 border-pink-300 text-xs font-bold outline-none"
                                                                />
                                                            ) : (
                                                                <span
                                                                    onClick={() => setEditingCredits({ id: u.id, amount: u.credits, original: u.credits })}
                                                                    className="text-pink-500 font-bold hover:bg-pink-50 px-2.5 py-1 rounded-lg transition-colors"
                                                                >
                                                                    {u.credits} 次
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="cursor-pointer min-h-[1.75rem] flex items-center">
                                                            {editingPoints?.id === u.id ? (
                                                                <input
                                                                    autoFocus
                                                                    type="number"
                                                                    value={editingPoints.amount}
                                                                    onClick={e => e.stopPropagation()}
                                                                    onChange={e => setEditingPoints({ ...editingPoints, amount: parseInt(e.target.value) || 0 })}
                                                                    onBlur={() => {
                                                                        const diff = editingPoints.amount - editingPoints.original;
                                                                        if (diff !== 0) updatePoints(u.id, diff);
                                                                        else setEditingPoints(null);
                                                                    }}
                                                                    className="w-16 h-7 px-1.5 rounded-lg border-2 border-purple-300 text-xs font-bold outline-none"
                                                                />
                                                            ) : (
                                                                <span
                                                                    onClick={() => setEditingPoints({ id: u.id, amount: u.points || 0, original: u.points || 0 })}
                                                                    className="text-purple-500 font-bold hover:bg-purple-50 px-2.5 py-1 rounded-lg transition-colors"
                                                                >
                                                                    {u.points || 0} 分
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-orange-500 font-bold text-sm">¥{u.commission_balance || '0.00'}</td>
                                                    <td className="py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingCredits({ id: u.id, amount: u.credits, original: u.credits })}
                                                                className="text-xs text-indigo-500 font-bold hover:underline"
                                                            >
                                                                调额
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'commissions' && (
                        <div className="bg-white rounded-3xl p-6 border shadow-sm">
                            <h3 className="font-bold mb-4">💰 推广佣金明细</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-400 border-b pb-4">
                                            <th className="pb-3 font-semibold">获利用户</th>
                                            <th className="pb-3 font-semibold">来源</th>
                                            <th className="pb-3 font-semibold">金额</th>
                                            <th className="pb-3 font-semibold">时间</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {commissions.map(req => (
                                            <tr key={req.id} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 font-bold text-slate-800">{req.users?.nickname || req.users?.username}</td>
                                                <td className="py-4 text-gray-500 text-xs">@{req.source_user?.username} 充值</td>
                                                <td className="py-4 text-green-600 font-bold">+{req.amount}元</td>
                                                <td className="py-4 text-gray-400 text-xs">{new Date(req.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {commissions.length === 0 && (
                                    <div className="py-12 text-center text-gray-400 text-xs font-semibold">暂无佣金记录</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'withdrawals' && (
                        <div className="bg-white rounded-3xl p-6 border shadow-sm">
                            <h3 className="font-bold mb-4">🏧 佣金提现管理</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-400 border-b pb-4">
                                            <th className="pb-3 font-semibold">申请用户</th>
                                            <th className="pb-3 font-semibold">金额</th>
                                            <th className="pb-3 font-semibold">状态</th>
                                            <th className="pb-3 font-semibold">时间</th>
                                            <th className="pb-3 font-semibold">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {withdrawals.map(req => (
                                            <tr key={req.id} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4">
                                                    <div className="font-bold text-slate-800">{req.username}</div>
                                                    <div className="text-[10px] text-gray-400">UID: {req.user_id?.slice(0, 8)}...</div>
                                                </td>
                                                <td className="py-4 text-red-500 font-bold">¥{req.amount}</td>
                                                <td className="py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                        req.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                                        req.status === 'approved' ? 'bg-green-100 text-green-600' :
                                                        'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        {req.status === 'pending' ? '待处理' : req.status === 'approved' ? '已支付' : '已拒绝'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-gray-400 text-xs whitespace-nowrap">{new Date(req.created_at).toLocaleString()}</td>
                                                <td className="py-4">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleProcessWithdrawal(req.id, 'approved')}
                                                                disabled={processingId === req.id}
                                                                className="px-3.5 py-1.5 bg-green-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-green-500/10"
                                                            >批准支付</button>
                                                            <button
                                                                onClick={() => handleProcessWithdrawal(req.id, 'rejected')}
                                                                disabled={processingId === req.id}
                                                                className="px-3.5 py-1.5 bg-gray-200 text-gray-500 rounded-xl text-xs font-bold active:scale-95 transition-all"
                                                            >拒绝</button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {withdrawals.length === 0 && (
                                    <div className="py-12 text-center text-gray-400 text-xs font-semibold">暂无提现申请</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'linktree' && (
                        <div className="bg-white rounded-3xl p-6 border shadow-sm min-h-[500px]">
                            <LinktreeAdmin adminId={admin.id} />
                        </div>
                    )}

            {activeTab === 'config' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 左侧栏：系统公告、开关设置、兑换配置与兑换码生成 */}
                    <div className="space-y-6">
                        {/* 📢 网站公告 */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="text-lg">📢</span> 网站公告
                            </h3>
                            <div className="flex flex-col gap-2 p-4 bg-pink-50/40 rounded-2xl border border-pink-100/60">
                                <label className="text-xs font-bold text-pink-700">首页滚动展示公告 (支持多行配置)</label>
                                <textarea
                                    value={config.announcement || ''}
                                    onChange={e => updateConfig('announcement', e.target.value)}
                                    className="w-full h-24 px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-300 outline-none text-sm bg-white text-slate-700"
                                    placeholder="请输入公告内容，例如：欢迎使用美力实验室！新版已上线，体验更流畅。✨"
                                />
                            </div>
                        </div>

                        {/* ⚙️ 系统开关与分佣机制 */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="text-lg">⚙️</span> 系统开关与分佣机制
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 充值开关 */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="font-bold text-sm text-slate-700">充值开关</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">控制前台充值面板入口</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('recharge_enabled', config.recharge_enabled === 'true' ? 'false' : 'true')}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.recharge_enabled === 'true' ? 'bg-pink-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.recharge_enabled === 'true' ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {/* 推荐分佣计划开关 */}
                                <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                    <div>
                                        <p className="font-bold text-sm text-orange-700">推广分佣计划</p>
                                        <p className="text-[10px] text-orange-500 mt-0.5">控制前台分佣模块展示</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('referral_program_enabled', config.referral_program_enabled !== 'false' ? 'false' : 'true')}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.referral_program_enabled !== 'false' ? 'bg-orange-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.referral_program_enabled !== 'false' ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {/* 推荐奖励积分 */}
                                <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                                    <div>
                                        <p className="font-bold text-sm text-purple-700">推荐奖励积分</p>
                                        <p className="text-[10px] text-purple-500 mt-0.5">控制新注册是否赠积分</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('referral_points_enabled', config.referral_points_enabled === 'true' ? 'false' : 'true')}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.referral_points_enabled === 'true' ? 'bg-purple-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.referral_points_enabled === 'true' ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {/* 首页下载按钮 */}
                                <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                    <div>
                                        <p className="font-bold text-sm text-indigo-700">首页下载按钮</p>
                                        <p className="text-[10px] text-indigo-500 mt-0.5">开启后前台显示下载入口</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('home_download_app_enabled', config.home_download_app_enabled !== 'false' ? 'false' : 'true')}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.home_download_app_enabled !== 'false' ? 'bg-indigo-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.home_download_app_enabled !== 'false' ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {/* 添加到桌面显示 */}
                                <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                                    <div>
                                        <p className="font-bold text-sm text-rose-700">添加到桌面提示</p>
                                        <p className="text-[10px] text-rose-500 mt-0.5">提示引导用户添加快捷方式</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('home_add_to_desktop_enabled', config.home_add_to_desktop_enabled !== 'false' ? 'false' : 'true')}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.home_add_to_desktop_enabled !== 'false' ? 'bg-rose-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.home_add_to_desktop_enabled !== 'false' ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {/* 免费福利与推荐奖励展示 */}
                                <div className="flex items-center justify-between p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
                                    <div>
                                        <p className="font-bold text-sm text-teal-800">首页底部福利栏</p>
                                        <p className="text-[10px] text-teal-600 mt-0.5">控制首页底侧活动通告展示</p>
                                    </div>
                                    <button
                                        onClick={() => updateConfig('home_rewards_enabled', config.home_rewards_enabled !== 'false' ? 'false' : 'true')}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.home_rewards_enabled !== 'false' ? 'bg-indigo-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.home_rewards_enabled !== 'false' ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* 基础参数设置 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                                {/* 注册频率限制 */}
                                <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="text-xs font-bold text-slate-500">IP 注册限制 (24h)</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="number"
                                            value={config.registration_limit_per_24h || '3'}
                                            onChange={e => updateConfig('registration_limit_per_24h', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold bg-white focus:border-pink-300 outline-none text-sm"
                                            placeholder="3"
                                        />
                                        <span className="text-xs text-slate-400 shrink-0 font-medium">次/24h</span>
                                    </div>
                                </div>

                                {/* 佣金比例 */}
                                <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="text-xs font-bold text-slate-500">推广返还佣金比例 (%)</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="number"
                                            value={config.commission_rate || '40'}
                                            onChange={e => updateConfig('commission_rate', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-orange-500 font-bold bg-white focus:border-pink-300 outline-none text-sm"
                                            placeholder="40"
                                        />
                                        <span className="text-xs text-slate-400 shrink-0 font-medium">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* AI 服务商选择 */}
                            <div className="mt-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm text-purple-700">AI 模型服务商</p>
                                    <p className="text-[10px] text-purple-500 mt-0.5">
                                        {config.ai_provider === 'gemini' ? '当前：Gemini API (耗 API Key)' : '当前：Vertex AI (耗 GCP 赠金)'}
                                    </p>
                                </div>
                                <div className="flex bg-slate-200/80 p-1 rounded-xl shrink-0">
                                    <button
                                        onClick={() => updateConfig('ai_provider', 'vertex')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${config.ai_provider !== 'gemini' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Vertex
                                    </button>
                                    <button
                                        onClick={() => updateConfig('ai_provider', 'gemini')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${config.ai_provider === 'gemini' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Gemini
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ⭐ 积分兑换红包配置 */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <span className="text-lg">⭐</span> 积分兑换红包参数
                            </h3>
                            <p className="text-[10px] text-gray-400 mb-4">修改后前台实时生效，用户兑换时基于新规则计费</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5 p-4 bg-purple-50/20 rounded-2xl border border-purple-100/40">
                                    <label className="text-xs text-purple-700 font-bold">档位1：所需积分</label>
                                    <input
                                        type="number"
                                        value={config.points_threshold_1 || '50'}
                                        onChange={e => updateConfig('points_threshold_1', e.target.value)}
                                        className="h-10 px-4 rounded-xl border border-purple-200/40 text-slate-700 font-bold bg-white focus:border-pink-300 outline-none text-sm"
                                        placeholder="50"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 p-4 bg-purple-50/20 rounded-2xl border border-purple-100/40">
                                    <label className="text-xs text-pink-600 font-bold">档位1：红包金额 (元)</label>
                                    <input
                                        type="number"
                                        value={config.points_reward_1 || '20'}
                                        onChange={e => updateConfig('points_reward_1', e.target.value)}
                                        className="h-10 px-4 rounded-xl border border-purple-200/40 text-pink-500 font-bold bg-white focus:border-pink-300 outline-none text-sm"
                                        placeholder="20"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 p-4 bg-purple-50/20 rounded-2xl border border-purple-100/40">
                                    <label className="text-xs text-purple-700 font-bold">档位2：所需积分</label>
                                    <input
                                        type="number"
                                        value={config.points_threshold_2 || '100'}
                                        onChange={e => updateConfig('points_threshold_2', e.target.value)}
                                        className="h-10 px-4 rounded-xl border border-purple-200/40 text-slate-700 font-bold bg-white focus:border-pink-300 outline-none text-sm"
                                        placeholder="100"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 p-4 bg-purple-50/20 rounded-2xl border border-purple-100/40">
                                    <label className="text-xs text-pink-600 font-bold">档位2：红包金额 (元)</label>
                                    <input
                                        type="number"
                                        value={config.points_reward_2 || '50'}
                                        onChange={e => updateConfig('points_reward_2', e.target.value)}
                                        className="h-10 px-4 rounded-xl border border-purple-200/40 text-pink-500 font-bold bg-white focus:border-pink-300 outline-none text-sm"
                                        placeholder="50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 🛠️ 兑换码生成助手 */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">🛠️</span>
                                <h3 className="font-bold text-slate-800 text-base">兑换码批量生成工具 (算法同步)</h3>
                            </div>
                            <div className="bg-purple-50/60 rounded-2xl p-4 mb-4 text-xs text-purple-700 leading-relaxed border border-purple-100/40">
                                <p className="font-bold mb-1">💡 兑换码生成说明：</p>
                                <p>生成的兑换码遵循今日日期算法（DD AA XX BBB），即发即用。兑换码全局唯一，一旦成功兑换即作废。</p>
                            </div>
                            <div className="flex gap-4 items-end mb-4">
                                <div className="flex-1">
                                    <label className="block text-[10px] text-slate-400 font-bold mb-1.5 ml-1">生成数量 (1-50)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="50"
                                        id="gen-count"
                                        defaultValue="5"
                                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold outline-none focus:border-purple-300 transition-all text-sm bg-white"
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        const count = parseInt((document.getElementById('gen-count') as HTMLInputElement).value) || 5;
                                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                                        
                                        // 计算北京时间日期组件
                                        const now = new Date();
                                        const beijingOffset = 8 * 60; 
                                        const localOffset = now.getTimezoneOffset();
                                        const bjTime = new Date(now.getTime() + (beijingOffset + localOffset) * 60 * 1000);
                                        
                                        const dd = String(bjTime.getDate()).padStart(2, '0');
                                        const future = new Date(bjTime);
                                        future.setDate(bjTime.getDate() + 13);
                                        const xx = String(future.getDate()).padStart(2, '0');
                                        
                                        const results = [];
                                        for(let i=0; i<count; i++) {
                                            const aa = chars[Math.floor(Math.random()*26)] + chars[Math.floor(Math.random()*26)];
                                            const bbb = chars[Math.floor(Math.random()*26)] + chars[Math.floor(Math.random()*26)] + chars[Math.floor(Math.random()*26)];
                                            results.push(`${dd}${aa}${xx}${bbb}`);
                                        }
                                        const area = document.getElementById('gen-results') as HTMLTextAreaElement;
                                        area.value = results.join('\n');
                                    }}
                                    className="h-10 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-purple-500/10 shrink-0"
                                >
                                    生成今日兑换码
                                </button>
                            </div>
                            <div className="relative">
                                <textarea 
                                    id="gen-results"
                                    readOnly
                                    placeholder="点击生成按钮后，兑换码将显示在这里..."
                                    className="w-full h-36 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono text-purple-600 leading-relaxed outline-none resize-none"
                                />
                                <button 
                                    onClick={() => {
                                        const area = document.getElementById('gen-results') as HTMLTextAreaElement;
                                        if(!area.value) return;
                                        navigator.clipboard.writeText(area.value).then(() => {
                                            alert('兑换码列表已全部复制到剪贴板！');
                                        });
                                    }}
                                    className="absolute right-3 bottom-3 py-1.5 px-3 bg-white border border-purple-100 text-purple-600 hover:bg-purple-50 rounded-xl text-[10px] font-bold shadow-sm active:scale-95 transition-all"
                                >
                                    一键复制全部
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 右侧栏：支付通道与排行榜配置 */}
                    <div className="space-y-6">
                        {/* 💰 支付宝配置 */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="text-lg">💰</span> 支付宝支付配置
                            </h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-slate-500 font-bold ml-1">应用 AppID</label>
                                    <input
                                        type="text"
                                        value={config.alipay_app_id || ''}
                                        onChange={e => updateConfig('alipay_app_id', e.target.value)}
                                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white focus:border-pink-300 outline-none text-sm"
                                        placeholder="支付宝应用AppID"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-slate-500 font-bold ml-1">应用私钥 (明文)</label>
                                    <textarea
                                        value={config.alipay_private_key || ''}
                                        onChange={e => updateConfig('alipay_private_key', e.target.value)}
                                        className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 bg-white resize-none focus:border-pink-300 outline-none"
                                        placeholder="MIIEvgIBADANBgkqhkiG9w0BAQEFAASC..."
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-slate-500 font-bold ml-1">支付宝公钥 (明文)</label>
                                    <textarea
                                        value={config.alipay_public_key || ''}
                                        onChange={e => updateConfig('alipay_public_key', e.target.value)}
                                        className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 bg-white resize-none focus:border-pink-300 outline-none"
                                        placeholder="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-slate-500 font-bold ml-1">支付网关</label>
                                        <input
                                            type="text"
                                            value={config.alipay_gateway || 'https://openapi.alipay.com/gateway.do'}
                                            onChange={e => updateConfig('alipay_gateway', e.target.value)}
                                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 focus:border-pink-300 outline-none"
                                            placeholder="https://openapi.alipay.com/gateway.do"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-slate-500 font-bold ml-1">回调地址</label>
                                        <input
                                            type="text"
                                            value={config.alipay_notify_url || ''}
                                            onChange={e => updateConfig('alipay_notify_url', e.target.value)}
                                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 focus:border-pink-300 outline-none"
                                            placeholder="https://yourdomain.com/api/alipay/notify"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🌍 Creem 国际支付配置 */}
                        <div className="bg-white rounded-3xl p-6 border-2 border-pink-100 shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🌍</span>
                                    <span>Creem 国际支付</span>
                                    <span className="text-[9px] bg-pink-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Global</span>
                                </div>
                                <button
                                    onClick={() => updateConfig('creem_payment_enabled', config.creem_payment_enabled !== 'false' ? 'false' : 'true')}
                                    className={`w-10 h-5 rounded-full transition-all relative ${config.creem_payment_enabled !== 'false' ? 'bg-pink-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${config.creem_payment_enabled !== 'false' ? 'left-5.5' : 'left-0.5'}`} />
                                </button>
                            </h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-slate-500 font-bold ml-1 uppercase tracking-wider">Creem API Key</label>
                                    <input
                                        type="text"
                                        value={config.creem_api_key || ''}
                                        onChange={e => updateConfig('creem_api_key', e.target.value)}
                                        className="w-full h-10 px-4 rounded-xl border border-pink-100 bg-pink-50/20 text-xs font-mono text-pink-700 focus:border-pink-300 outline-none"
                                        placeholder="creem_..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] text-slate-500 font-bold ml-1 uppercase tracking-wider">$5 Product ID</label>
                                        <input
                                            type="text"
                                            value={config.creem_product_id_5usd || ''}
                                            onChange={e => updateConfig('creem_product_id_5usd', e.target.value)}
                                            className="w-full h-10 px-3.5 rounded-xl border border-pink-100 bg-pink-50/20 text-[10px] font-mono text-pink-700 focus:border-pink-300 outline-none"
                                            placeholder="prod_..."
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] text-slate-500 font-bold ml-1 uppercase tracking-wider">$10 Product ID</label>
                                        <input
                                            type="text"
                                            value={config.creem_product_id_10usd || ''}
                                            onChange={e => updateConfig('creem_product_id_10usd', e.target.value)}
                                            className="w-full h-10 px-3.5 rounded-xl border border-pink-100 bg-pink-50/20 text-[10px] font-mono text-pink-700 focus:border-pink-300 outline-none"
                                            placeholder="prod_..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🏆 排行榜虚拟数据配置 */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-lg">🏆</span> 排行榜虚拟数据 (各20行)
                                </h3>
                                <button
                                    onClick={() => {
                                        const c = generateRandomData('commission');
                                        const p = generateRandomData('points');
                                        updateConfig('commission_leaderboard_data', JSON.stringify(c));
                                        updateConfig('points_leaderboard_data', JSON.stringify(p));
                                        alert('随机数据已填充并保存 ✨');
                                    }}
                                    className="text-[10px] bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-bold hover:bg-amber-200 transition-all active:scale-95 shadow-sm shadow-amber-100/50"
                                >
                                    🎲 填充随机数据
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {/* 佣金虚拟数据 */}
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-amber-800 sticky top-0 bg-white py-1 z-10 border-b border-amber-100 mb-2">💰 推广佣金榜</p>
                                    {cBoard.map((item, i) => (
                                        <div key={i} className="flex gap-2">
                                            <span className="w-5 text-[10px] text-amber-600 flex items-center justify-center font-bold">{i + 1}</span>
                                            <input
                                                type="text"
                                                placeholder="用户名"
                                                value={item.user || ''}
                                                onChange={e => {
                                                    const newData = [...cBoard];
                                                    newData[i] = { ...newData[i], user: e.target.value };
                                                    setCBoard(newData);
                                                }}
                                                onBlur={() => updateConfig('commission_leaderboard_data', JSON.stringify(cBoard))}
                                                className="flex-1 h-8 px-2 rounded-lg border border-slate-200 text-[10px] shadow-sm bg-white outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="金额"
                                                value={item.amount || ''}
                                                onChange={e => {
                                                    const newData = [...cBoard];
                                                    newData[i] = { ...newData[i], amount: e.target.value };
                                                    setCBoard(newData);
                                                }}
                                                onBlur={() => updateConfig('commission_leaderboard_data', JSON.stringify(cBoard))}
                                                className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-[10px] text-center font-bold text-amber-600 shadow-sm bg-white outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* 积分虚拟数据 */}
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-indigo-800 sticky top-0 bg-white py-1 z-10 border-b border-indigo-100 mb-2">⭐ 积分兑换榜</p>
                                    {pBoard.map((item, i) => (
                                        <div key={i} className="flex gap-2">
                                            <span className="w-5 text-[10px] text-indigo-400 flex items-center justify-center font-bold">{i + 1}</span>
                                            <input
                                                type="text"
                                                placeholder="用户名"
                                                value={item.user || ''}
                                                onChange={e => {
                                                    const newData = [...pBoard];
                                                    newData[i] = { ...newData[i], user: e.target.value };
                                                    setPBoard(newData);
                                                }}
                                                onBlur={() => updateConfig('points_leaderboard_data', JSON.stringify(pBoard))}
                                                className="flex-1 h-8 px-2 rounded-lg border border-slate-200 text-[10px] shadow-sm bg-white outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="金额"
                                                value={item.amount || ''}
                                                onChange={e => {
                                                    const newData = [...pBoard];
                                                    newData[i] = { ...newData[i], amount: e.target.value };
                                                    setPBoard(newData);
                                                }}
                                                onBlur={() => updateConfig('points_leaderboard_data', JSON.stringify(pBoard))}
                                                className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-[10px] text-center font-bold text-indigo-600 shadow-sm bg-white outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 客服支持标签页 */}
            {activeTab === 'support' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex" style={{ height: 'calc(100vh - 120px)' }}>
                    {/* 左栏：会话列表（固定宽 320px） */}
                    <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50">
                        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                <span>💬</span> 客服会话 ({conversations.length})
                            </h3>
                            <button 
                                onClick={handleCleanupMessages}
                                title="清理 3 个月前的旧数据"
                                className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all active:scale-90"
                            >
                                🗑️
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {conversations.length === 0 && (
                                <div className="text-center py-12 text-slate-400 text-xs font-medium">暂无客服消息</div>
                            )}
                            {conversations.map((conv: any) => (
                                <div
                                    key={conv.user_id}
                                    onClick={() => setSelectedUserId(conv.user_id)}
                                    className={`p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col gap-1 border border-transparent ${
                                        selectedUserId === conv.user_id 
                                            ? 'bg-white border-slate-100 shadow-sm relative' 
                                            : 'hover:bg-white hover:border-slate-50'
                                    }`}
                                >
                                    {selectedUserId === conv.user_id && (
                                        <div className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-pink-500 rounded-r-full" />
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-xs text-slate-700 truncate">
                                            @{conv.username || conv.user_id.slice(0, 8)}
                                        </span>
                                        {conv.unread_count > 0 && (
                                            <span className="h-5 px-1.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shrink-0">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate">{conv.last_message || '无消息内容'}</p>
                                    <p className="text-[9px] text-slate-300 text-right mt-1">
                                        {conv.last_time ? new Date(conv.last_time).toLocaleString() : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 中栏：聊天窗口（flex-1） */}
                    <div className="flex-1 flex flex-col bg-slate-50/20 border-r border-slate-100">
                        {!selectedUserId ? (
                            <div className="flex-1 flex items-center justify-center text-slate-300">
                                <div className="text-center space-y-2">
                                    <div className="text-6xl animate-bounce">💬</div>
                                    <p className="text-sm font-bold text-slate-400">选择左侧会话开始回复</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* 聊天头部 */}
                                <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <span className="font-black text-sm text-slate-800 block">
                                                @{conversations.find(c => c.user_id === selectedUserId)?.username || selectedUserId.slice(0, 8)}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                                                正在对话中...
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">{supportMessages.length} 条消息</span>
                                </div>

                                {/* 消息列表 */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
                                    {supportMessages.map((msg: any) => (
                                        <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className="max-w-[70%] group space-y-1">
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                    msg.sender_type === 'admin'
                                                        ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-tr-none'
                                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                                }`}>
                                                    {adminTranslated[msg.id] || msg.content}
                                                </div>
                                                <div className={`flex items-center gap-2.5 ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-[9px] text-slate-400">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <button
                                                        onClick={() => handleAdminTranslate(msg.id, msg.content)}
                                                        className="text-[9px] text-pink-500 hover:underline transition-colors font-bold"
                                                    >
                                                        {adminTranslatingId === msg.id ? '翻译中...' : (adminTranslated[msg.id] ? '查看原文' : '翻译此条')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={supportEndRef} />
                                </div>

                                {/* 回复输入 */}
                                <div className="border-t border-slate-100 p-4 flex gap-3 bg-white">
                                    <input
                                        type="text"
                                        value={replyInput}
                                        onChange={e => setReplyInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSupportReply()}
                                        placeholder="输入回复内容，按下回车发送..."
                                        className="flex-1 h-11 px-5 rounded-full bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-pink-300 focus:bg-white transition-all"
                                    />
                                    <button
                                        onClick={handleSupportReply}
                                        disabled={replySending || !replyInput.trim()}
                                        className="px-6 h-11 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-pink-500/10 flex items-center justify-center"
                                    >
                                        {replySending ? '...' : '发送'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 右栏：当前选中用户的基本画像及快捷调额工具（固定宽 300px） */}
                    <div className="w-80 shrink-0 bg-white p-6 overflow-y-auto flex flex-col gap-6">
                        {!selectedUserId ? (
                            <div className="flex-1 flex items-center justify-center text-slate-300 text-center py-12">
                                <p className="text-xs font-bold text-slate-400">暂无选中用户详情</p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 border-slate-100 mb-4">👤 用户画像</h4>
                                    {(() => {
                                        const selectedUser = users.find(u => u.id === selectedUserId);
                                        if (selectedUser) {
                                            return (
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold">昵称</p>
                                                        <p className="text-sm font-black text-slate-800 mt-0.5">{selectedUser.nickname || '未设置'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold">登录用户名</p>
                                                        <p className="text-xs text-slate-600 font-mono mt-0.5">@{selectedUser.username}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold">用户 ID</p>
                                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 break-all">{selectedUser.id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold">注册时间</p>
                                                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(selectedUser.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return <p className="text-xs text-slate-400 italic">正在加载用户数据...</p>;
                                    })()}
                                </div>

                                {(() => {
                                    const selectedUser = users.find(u => u.id === selectedUserId);
                                    if (selectedUser) {
                                        return (
                                            <div className="space-y-4 border-t pt-4 border-slate-100">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🛠️ 客服快捷工具箱</h4>
                                                
                                                {/* 调测试额度 */}
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-600">剩余测试次数</span>
                                                        <span className="text-sm font-black text-pink-500">{selectedUser.credits} 次</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            id="quick-credits-diff"
                                                            placeholder="增减值(+5/-3)"
                                                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                                                        />
                                                        <button
                                                            onClick={async () => {
                                                                const input = document.getElementById('quick-credits-diff') as HTMLInputElement;
                                                                const diff = parseInt(input.value) || 0;
                                                                if (diff !== 0) {
                                                                    await updateCredits(selectedUser.id, diff);
                                                                    input.value = '';
                                                                }
                                                            }}
                                                            className="px-3 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600 transition-all active:scale-95 shadow-sm shadow-pink-500/10"
                                                        >
                                                            调额
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 调积分 */}
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-600">用户积分</span>
                                                        <span className="text-sm font-black text-purple-600">{selectedUser.points || 0} 分</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            id="quick-points-diff"
                                                            placeholder="增减值(+50/-10)"
                                                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                                                        />
                                                        <button
                                                            onClick={async () => {
                                                                const input = document.getElementById('quick-points-diff') as HTMLInputElement;
                                                                const diff = parseInt(input.value) || 0;
                                                                if (diff !== 0) {
                                                                    await updatePoints(selectedUser.id, diff);
                                                                    input.value = '';
                                                                }
                                                            }}
                                                            className="px-3 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all active:scale-95 shadow-sm shadow-purple-500/10"
                                                        >
                                                            调分
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 佣金余额显示 */}
                                                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-amber-800">可提现佣金</span>
                                                    <span className="text-sm font-black text-amber-600">¥{selectedUser.commission_balance || '0.00'}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* AI 用量日志标签页 */}
            {activeTab === 'ai' && (
                <div className="space-y-6">
                    {/* AI 统计概览 */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">总调用次数</div>
                            <div className="text-2xl font-black text-indigo-600">
                                {aiUsage.reduce((acc, curr) => acc + curr.usage_count, 0)}
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">累计耗费 Tokens</div>
                            <div className="text-2xl font-black text-purple-600">
                                {(aiUsage.reduce((acc, curr) => acc + curr.total_tokens, 0) / 1000).toFixed(1)}k
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">预估累计支出</div>
                            <div className="text-2xl font-black text-pink-500">
                                ${aiUsage.reduce((acc, curr) => {
                                    const input = curr.prompt_tokens || 0;
                                    const output = curr.completion_tokens || 0;
                                    const isPro = curr.model_id?.includes('pro');
                                    const rates = isPro ? { in: 3.5, out: 10.5 } : { in: 0.075, out: 0.30 };
                                    return acc + (input / 1000000 * rates.in) + (output / 1000000 * rates.out);
                                }, 0).toFixed(4)}
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">请求成功率</div>
                            <div className="text-2xl font-black text-green-500">
                                {recentAiLogs.length > 0 
                                    ? Math.round((recentAiLogs.filter(l => l.status === 'success').length / recentAiLogs.length) * 100) 
                                    : 100}%
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">活动模型数量</div>
                            <div className="text-2xl font-black text-orange-500">{aiUsage.length}</div>
                        </div>
                    </div>

                    {/* 模型详细分配 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span>📊</span> 模型用量分布 (Tokens)
                        </h3>
                        <div className="space-y-6">
                            {aiUsage.map(model => {
                                const total = aiUsage.reduce((acc, curr) => acc + curr.total_tokens, 0);
                                const percentage = total > 0 ? (model.total_tokens / total) * 100 : 0;
                                
                                // 根据模型 ID 获取计费（默认 Flash 价格）
                                const isPro = model.model_id.includes('pro');
                                const rates = isPro ? { in: 3.5, out: 10.5 } : { in: 0.075, out: 0.30 };
                                const cost = (model.prompt_tokens / 1000000 * rates.in) + (model.completion_tokens / 1000000 * rates.out);

                                return (
                                    <div key={model.model_id} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-sm font-bold text-slate-700">{model.model_id}</span>
                                                <span className="ml-2 text-[10px] text-slate-400">调用 {model.usage_count} 次</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-indigo-600">{model.total_tokens.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">Tokens</span></div>
                                                <div className="text-[10px] font-bold text-pink-500">${cost.toFixed(4)}</div>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000" 
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="flex gap-4 text-[9px] text-slate-400">
                                            <span>输入: {model.prompt_tokens.toLocaleString()}</span>
                                            <span>输出: {model.completion_tokens.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {aiUsage.length === 0 && (
                                <div className="py-10 text-center text-slate-400 text-xs font-semibold">暂无使用数据</div>
                            )}
                        </div>
                    </div>

                    {/* 最近活动日志 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span>🕒</span> 最近调用日志明细
                            </h3>
                            <button 
                                onClick={loadData}
                                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full font-bold transition-all active:scale-95"
                            >
                                刷新数据
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-50">
                                        <th className="pb-3 font-bold">动作</th>
                                        <th className="pb-3 font-bold">使用模型</th>
                                        <th className="pb-3 font-bold">总 Tokens</th>
                                        <th className="pb-3 font-bold">请求耗时</th>
                                        <th className="pb-3 font-bold">状态</th>
                                        <th className="pb-3 font-bold">调用时间</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentAiLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 pr-4">
                                                <div className="text-xs font-bold text-slate-700 break-all max-w-[150px] leading-tight">{log.action || 'unknown'}</div>
                                            </td>
                                            <td className="py-4">
                                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                                                    {log.model_id}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <div className="text-xs font-bold text-indigo-600">{log.total_tokens || 0}</div>
                                                <div className="text-[9px] text-pink-500 font-medium">
                                                    {(() => {
                                                        const isPro = log.model_id?.includes('pro');
                                                        const rates = isPro ? { in: 3.5, out: 10.5 } : { in: 0.075, out: 0.30 };
                                                        const cost = ((log.prompt_tokens || 0) / 1000000 * rates.in) + ((log.completion_tokens || 0) / 1000000 * rates.out);
                                                        return `$${cost.toFixed(5)}`;
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="text-[10px] text-slate-400 font-semibold">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                    log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {log.status === 'success' ? '成功' : '失败'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <div className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {recentAiLogs.length === 0 && (
                                <div className="py-20 text-center">
                                    <div className="text-4xl mb-2">🔭</div>
                                    <div className="text-slate-400 text-xs">尚无任何活动记录</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
                </div>
            </div>
        </div>
    );
};

export default AdminView;
