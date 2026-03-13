import React, { useState, useEffect } from 'react';
import { API_BASE } from '../lib/config';

interface AdminViewProps {
    admin: any;
    onBack: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ admin, onBack }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [config, setConfig] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0 });
    const [editingCredits, setEditingCredits] = useState<{ id: string; amount: number } | null>(null);
    const [editingPoints, setEditingPoints] = useState<{ id: string; amount: number } | null>(null);
    const [pointRedemptions, setPointRedemptions] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Chat states
    const [chatUsers, setChatUsers] = useState<any[]>([]);
    const [activeChatUser, setActiveChatUser] = useState<any>(null);
    const [adminMessages, setAdminMessages] = useState<any[]>([]);
    const [adminChatInput, setAdminChatInput] = useState('');
    const adminMessagesEndRef = React.useRef<HTMLDivElement>(null);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Init Admin
            await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'initAdmin' })
            });

            // Get users
            const usersRes = await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getUsers', adminId: admin.id })
            });
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);

            // Get config
            const configRes = await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getConfig', adminId: admin.id })
            });
            const configData = await configRes.json();
            setConfig(configData.config || {});

            // Get stats
            const statsRes = await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getStats', adminId: admin.id })
            });
            const statsData = await statsRes.json();
            setStats(statsData);

            // Get point redemptions
            const redemptionsRes = await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getPointRedemptions', adminId: admin.id })
            });
            const redemptionsData = await redemptionsRes.json();
            setPointRedemptions(redemptionsData.redemptions || []);

            // Get chat users
            fetchChatUsers();
            
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Update config
    const updateConfig = async (key: string, value: string) => {
        try {
            await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateConfig', adminId: admin.id, key, value })
            });
            setConfig({ ...config, [key]: value });
        } catch (e) {
            console.error(e);
        }
    };

    // Update user credits
    const updateCredits = async (userId: string, amount: number) => {
        try {
            await fetch(`${API_BASE}/api/admin`, {
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

    // Update user points
    const updatePoints = async (userId: string, amount: number) => {
        try {
            await fetch(`${API_BASE}/api/admin`, {
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

    // Process point redemption
    const processRedemption = async (redemptionId: string, approved: boolean) => {
        setProcessingId(redemptionId);
        try {
            await fetch(`${API_BASE}/api/admin`, {
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

    // Chat functions
    const fetchChatUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getChatUsers', adminId: admin.id })
            });
            const data = await res.json();
            setChatUsers(data.users || []);
        } catch (e) {
            console.error('Fetch chat users failed', e);
        }
    };

    const fetchAdminMessages = async (userId: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getAdminMessages', adminId: admin.id, userId })
            });
            const data = await res.json();
            if (data.success) {
                setAdminMessages(data.messages || []);
            }
        } catch (e) {
            console.error('Fetch admin messages failed', e);
        }
    };

    const handleAdminSend = async () => {
        if (!adminChatInput.trim() || !activeChatUser) return;
        
        const content = adminChatInput.trim();
        setAdminChatInput('');

        // Optimistic UI
        const optimisticMsg = {
            id: 'admin-temp-' + Date.now(),
            user_id: activeChatUser.id,
            sender_type: 'admin',
            content,
            created_at: new Date().toISOString(),
            is_read: true
        };
        setAdminMessages(prev => [...prev, optimisticMsg]);

        try {
            const res = await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'replyMessage', 
                    adminId: admin.id, 
                    userId: activeChatUser.id, 
                    content 
                })
            });
            const data = await res.json();
            if (data.success) {
                fetchAdminMessages(activeChatUser.id);
            }
        } catch (e) {
            console.error('Admin send failed', e);
        }
    };

    const handleClearAllMessages = async () => {
        if (!window.confirm('WARNING: Are you sure you want to delete ALL customer service messages? This cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clearMessages', adminId: admin.id })
            });
            const data = await res.json();
            if (data.success) {
                alert('All messages cleared successfully');
                setChatUsers([]);
                setActiveChatUser(null);
                setAdminMessages([]);
            }
        } catch (e) {
            console.error('Clear messages failed', e);
            alert('Failed to clear messages');
        }
    };

    useEffect(() => {
        let interval: any;
        if (activeChatUser) {
            fetchAdminMessages(activeChatUser.id);
            interval = setInterval(() => fetchAdminMessages(activeChatUser.id), 5000);
        }
        return () => clearInterval(interval);
    }, [activeChatUser]);

    useEffect(() => {
        adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [adminMessages]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">Admin Dashboard</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl p-4 text-white">
                    <div className="text-white/80 text-sm">Total Users</div>
                    <div className="text-3xl font-bold">{stats.totalUsers}</div>
                </div>
                <div className="bg-gradient-to-r from-purple-400 to-purple-500 rounded-2xl p-4 text-white">
                    <div className="text-white/80 text-sm">Paid Orders</div>
                    <div className="text-3xl font-bold">{stats.totalOrders}</div>
                </div>
            </div>

            {/* Point Redemptions */}
            {pointRedemptions.filter(r => r.status === 'pending').length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                    <h3 className="font-bold mb-4">💰 待处理申请 (积分/提现) <span className="text-pink-500">(待办: {pointRedemptions.filter(r => r.status === 'pending').length})</span></h3>
                    <div className="space-y-3">
                        {pointRedemptions.filter(r => r.status === 'pending').map(redemption => (
                            <div key={redemption.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm">{redemption.username}</p>
                                        {redemption.admin_note === 'CASH_WITHDRAWAL' && (
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-md">提现申请</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {redemption.admin_note === 'CASH_WITHDRAWAL'
                                            ? `提现金额: $${redemption.reward_amount}`
                                            : `${redemption.points_used} pts → $${redemption.reward_amount} Reward`
                                        }
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(redemption.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => processRedemption(redemption.id, true)}
                                        disabled={processingId === redemption.id}
                                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs"
                                    >
                                        {processingId === redemption.id ? '...' : (redemption.admin_note === 'CASH_WITHDRAWAL' ? '已通过并清零' : 'Approve')}
                                    </button>
                                    <button
                                        onClick={() => processRedemption(redemption.id, false)}
                                        disabled={processingId === redemption.id}
                                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Config Management */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <h3 className="font-bold mb-4">⚙️ System Config</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <label className="w-28 text-sm text-gray-500 shrink-0">Contact Email</label>
                        <input
                            type="text"
                            value={config.contact_email || ''}
                            onChange={e => updateConfig('contact_email', e.target.value)}
                            className="flex-1 h-10 px-3 rounded-xl border border-gray-200"
                            placeholder="e.g. 408457641@qq.com"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="w-28 text-sm text-gray-500 shrink-0">Buy Credits</label>
                        <button
                            onClick={() => updateConfig('recharge_enabled', config.recharge_enabled === 'true' ? 'false' : 'true')}
                            className={`px-4 py-2 rounded-xl ${config.recharge_enabled === 'true' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                        >
                            {config.recharge_enabled === 'true' ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="w-28 text-sm text-gray-500 shrink-0">Referral Points</label>
                        <button
                            onClick={() => updateConfig('referral_points_enabled', config.referral_points_enabled === 'true' ? 'false' : 'true')}
                            className={`px-4 py-2 rounded-xl ${config.referral_points_enabled === 'true' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                        >
                            {config.referral_points_enabled === 'true' ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Minimum App Version (Forced Update)</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="e.g. 20260306-V1"
                            value={config.min_app_version || ''}
                            onChange={e => setConfig({ ...config, min_app_version: e.target.value })}
                            className="flex-1 bg-white border border-orange-200 px-4 py-2 rounded-xl text-sm"
                        />
                        <button
                            onClick={() => updateConfig('min_app_version', config.min_app_version)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"
                        >
                            Save
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">If a user's app version is lower than this value, they will be blocked by a full-screen prompt and forced to download the new APK. Leave empty or set to an old version to disable.</p>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="font-bold text-sm mb-4">📢 公告栏管理 (自动翻译支持: 中/英/越/韩/日/西)</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">输入中文公告 (保存后将自动翻译为其他语言)</label>
                            <textarea
                                value={config.announcement_zh || ''}
                                onChange={e => setConfig({ ...config, announcement_zh: e.target.value })}
                                className="w-full h-20 px-3 py-2 rounded-xl border border-gray-200 text-sm"
                                placeholder="输入想要展示的公告内容..."
                            />
                        </div>
                        <button
                            onClick={async () => {
                                const text = config.announcement_zh;
                                if (!text) return alert('请输入内容');
                                setProcessingId('translating_notice');
                                try {
                                    // 1. 调用 Gemini 翻译
                                    const res = await fetch(`${API_BASE}/api/gemini`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'translateAnnouncement', text })
                                    });
                                    const data = await res.json();
                                    if (data.result) {
                                        const translations = data.result;
                                        // 2. 批量更新配置
                                        const updates = [
                                            { key: 'announcement_zh', value: text },
                                            { key: 'announcement_en', value: translations.en },
                                            { key: 'announcement_vi', value: translations.vi },
                                            { key: 'announcement_ko', value: translations.ko },
                                            { key: 'announcement_ja', value: translations.ja },
                                            { key: 'announcement_es', value: translations.es },
                                        ];

                                        for (const update of updates) {
                                            await fetch(`${API_BASE}/api/admin`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ action: 'updateConfig', adminId: admin.id, ...update })
                                            });
                                        }
                                        alert('公告已更新并完成多语言翻译！');
                                        loadData();
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert('更新失败，请重试');
                                } finally {
                                    setProcessingId(null);
                                }
                            }}
                            disabled={processingId === 'translating_notice'}
                            className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 disabled:opacity-50"
                        >
                            {processingId === 'translating_notice' ? '正在翻译并保存...' : '✨ 保存并一键自动翻译'}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {['en', 'vi', 'ko', 'ja', 'es'].map(lang => (
                                <div key={lang} className="p-2 bg-gray-50 rounded-lg text-[11px]">
                                    <span className="font-bold text-gray-400 uppercase mr-1">{lang}:</span>
                                    <span className="text-gray-600">{config[`announcement_${lang}`] || '未覆盖'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stripe 配置 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <h3 className="font-bold mb-4">💳 Stripe Payment Config</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <label className="w-28 text-sm text-gray-500 shrink-0">Publishable Key</label>
                        <input
                            type="text"
                            value={config.stripe_publishable_key || ''}
                            onChange={e => updateConfig('stripe_publishable_key', e.target.value)}
                            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm font-mono"
                            placeholder="pk_live_xxx or pk_test_xxx"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="w-28 text-sm text-gray-500 shrink-0">Webhook Secret</label>
                        <input
                            type="text"
                            value={config.stripe_webhook_secret || ''}
                            onChange={e => updateConfig('stripe_webhook_secret', e.target.value)}
                            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm font-mono"
                            placeholder="whsec_xxx"
                        />
                    </div>
                    <p className="text-xs text-gray-400">
                        💡 Pricing: $1.99 = 12 credits, $3.99 = 30 credits
                    </p>
                    <p className="text-xs text-gray-400">
                        ⚠️ Secret Key should be set via environment variable (STRIPE_SECRET_KEY) for security.
                    </p>
                </div>
            </div>

            {/* 客服消息管理 (Customer Service) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <span className="text-xl">💬</span> 客服消息管理
                    </h3>
                    <button 
                        onClick={handleClearAllMessages}
                        className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl text-xs font-bold transition-colors"
                    >
                        🗑️ 清空所有聊天记录 (释放空间)
                    </button>
                </div>
                
                <div className="flex border border-gray-200 rounded-xl overflow-hidden h-[500px]">
                    {/* 左侧：用户列表 */}
                    <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                        <div className="p-3 font-bold text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200 sticky top-0 bg-gray-50">
                            Recent Chats
                        </div>
                        {chatUsers.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400">
                                暂无客服信息
                            </div>
                        ) : (
                            chatUsers.map(u => (
                                <div 
                                    key={u.id}
                                    onClick={() => setActiveChatUser(u)}
                                    className={`p-4 cursor-pointer border-b border-gray-100 transition-colors ${
                                        activeChatUser?.id === u.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-white'
                                    }`}
                                >
                                    <div className="font-bold text-sm text-gray-800">{u.nickname || u.username}</div>
                                    <div className="text-[10px] text-gray-400">ID: {u.id.substring(0, 8)}...</div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 右侧：聊天窗口 */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                        {activeChatUser ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-3 bg-white border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-bold">
                                        {activeChatUser.nickname?.[0] || activeChatUser.username[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{activeChatUser.nickname || activeChatUser.username}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{activeChatUser.username}</div>
                                    </div>
                                </div>
                                
                                {/* Messages Container */}
                                <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
                                    {adminMessages.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                            暂无对话内容
                                        </div>
                                    ) : (
                                        adminMessages.map(msg => {
                                            const isAdmin = msg.sender_type === 'admin';
                                            return (
                                                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${
                                                        isAdmin ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                                    }`}>
                                                        <p className="whitespace-pre-wrap word-break-all">{msg.content}</p>
                                                        <div className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={adminMessagesEndRef} />
                                </div>
                                
                                {/* Input Area */}
                                <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                                    <input 
                                        type="text"
                                        value={adminChatInput}
                                        onChange={e => setAdminChatInput(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleAdminSend()}
                                        placeholder={`回复 ${activeChatUser.nickname || activeChatUser.username}...`}
                                        className="flex-1 bg-gray-50 px-4 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-blue-400 transition-colors"
                                    />
                                    <button 
                                        onClick={handleAdminSend}
                                        disabled={!adminChatInput.trim()}
                                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all disabled:opacity-50"
                                    >
                                        发送
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                <span className="text-4xl mb-4">💬</span>
                                <p>在左侧选择一个用户开始聊天</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold mb-4">👥 User Management</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="pb-2">Username</th>
                                <th className="pb-2">Nickname</th>
                                <th className="pb-2">Credits</th>
                                <th className="pb-2">Points</th>
                                <th className="pb-2">Registered At</th>
                                <th className="pb-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-gray-100">
                                    <td className="py-3">{user.username}</td>
                                    <td className="py-3">{user.nickname}</td>
                                    <td className="py-3">
                                        {editingCredits?.id === user.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={editingCredits.amount}
                                                    onChange={e => setEditingCredits({ ...editingCredits, amount: parseInt(e.target.value) || 0 })}
                                                    className="w-16 h-8 px-2 rounded border"
                                                />
                                                <button
                                                    onClick={() => updateCredits(user.id, editingCredits.amount - user.credits)}
                                                    className="px-2 h-8 bg-green-500 text-white rounded text-xs"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-pink-500">{user.credits}</span>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        {editingPoints?.id === user.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={editingPoints.amount}
                                                    onChange={e => setEditingPoints({ ...editingPoints, amount: parseInt(e.target.value) || 0 })}
                                                    className="w-16 h-8 px-2 rounded border"
                                                />
                                                <button
                                                    onClick={() => updatePoints(user.id, editingPoints.amount - user.points)}
                                                    className="px-2 h-8 bg-purple-500 text-white rounded text-xs"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-purple-500">{user.points || 0}</span>
                                        )}
                                    </td>
                                    <td className="py-3 text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => setEditingCredits({ id: user.id, amount: user.credits })}
                                                className="text-pink-500 text-xs text-left"
                                            >
                                                Edit Credits
                                            </button>
                                            <button
                                                onClick={() => setEditingPoints({ id: user.id, amount: user.points || 0 })}
                                                className="text-purple-500 text-xs text-left"
                                            >
                                                Edit Points
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
    );
};

export default AdminView;
