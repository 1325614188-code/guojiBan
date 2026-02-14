import React, { useState, useEffect } from 'react';

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

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Init Admin
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'initAdmin' })
            });

            // Get users
            const usersRes = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getUsers', adminId: admin.id })
            });
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);

            // Get config
            const configRes = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getConfig', adminId: admin.id })
            });
            const configData = await configRes.json();
            setConfig(configData.config || {});

            // Get stats
            const statsRes = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getStats', adminId: admin.id })
            });
            const statsData = await statsRes.json();
            setStats(statsData);

            // Get point redemptions
            const redemptionsRes = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getPointRedemptions', adminId: admin.id })
            });
            const redemptionsData = await redemptionsRes.json();
            setPointRedemptions(redemptionsData.redemptions || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Update config
    const updateConfig = async (key: string, value: string) => {
        try {
            await fetch('/api/admin', {
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
            await fetch('/api/admin', {
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
            await fetch('/api/admin', {
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
            await fetch('/api/admin', {
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
                    <h3 className="font-bold mb-4">🌟 Point Redemptions <span className="text-pink-500">(Pending: {pointRedemptions.filter(r => r.status === 'pending').length})</span></h3>
                    <div className="space-y-3">
                        {pointRedemptions.filter(r => r.status === 'pending').map(redemption => (
                            <div key={redemption.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                                <div>
                                    <p className="font-bold text-sm">{redemption.username}</p>
                                    <p className="text-xs text-gray-500">
                                        {redemption.points_used} pts → ${redemption.reward_amount} Reward
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
                                        {processingId === redemption.id ? '...' : 'Approve'}
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
                            placeholder="e.g. chanlindong9@gmail.com"
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
