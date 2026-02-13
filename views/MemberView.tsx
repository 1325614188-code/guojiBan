import React, { useState, useEffect } from 'react';

interface MemberViewProps {
    user: any;
    onLogout: () => void;
    onBack: () => void;
    onUserUpdate?: (user: any) => void; // 用于同步更新父组件的 user 状态
}

const MemberView: React.FC<MemberViewProps> = ({ user, onLogout, onBack, onUserUpdate }) => {
    // NOTE: 直接使用 user.credits，不再维护独立的本地状态，避免状态不同步
    const [redeemCode, setRedeemCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [config, setConfig] = useState<any>({});
    const [copied, setCopied] = useState(false);
    const [rechargeMessage, setRechargeMessage] = useState('');
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const [referralCount, setReferralCount] = useState(0);
    const [userPoints, setUserPoints] = useState(0);
    const [pointsMessage, setPointsMessage] = useState('');

    // 获取设备ID后6位
    const getDeviceIdSuffix = (): string => {
        const deviceId = localStorage.getItem('device_id') || '';
        return deviceId.slice(-6).toUpperCase();
    };

    // 生成分享链接
    const getShareLink = (): string => {
        const baseUrl = window.location.origin;
        return `${baseUrl}?ref=${user?.id}&d=${getDeviceIdSuffix()}`;
    };

    // 加载配置
    useEffect(() => {
        fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getConfig' })
        })
            .then(res => res.json())
            .then(data => setConfig(data.config || {}))
            .catch(console.error);

        // 加载分享统计
        if (user?.id) {
            fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getReferralStats', userId: user.id })
            })
                .then(res => res.json())
                .then(data => setReferralCount(data.referralCount || 0))
                .catch(console.error);

            // 加载积分
            fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getPointsStats', userId: user.id })
            })
                .then(res => res.json())
                .then(data => setUserPoints(data.points || 0))
                .catch(console.error);
        }

        // 检查是否有待确认的订单（包括从 Stripe 跳转回来的场景）
        const savedOrderId = localStorage.getItem('pending_order_id');
        if (savedOrderId) {
            setPendingOrderId(savedOrderId);
        }

        // 检查 URL 参数中的支付结果
        const urlParams = new URLSearchParams(window.location.search);
        const paymentResult = urlParams.get('payment');
        const orderIdFromUrl = urlParams.get('order_id');
        if (paymentResult === 'success' && orderIdFromUrl) {
            setPendingOrderId(orderIdFromUrl);
            localStorage.setItem('pending_order_id', orderIdFromUrl);
            setRechargeMessage('⏳ Confirming payment, please wait...');
            // 清除 URL 参数
            window.history.replaceState({}, '', window.location.pathname);
            // NOTE: 支付成功后自动确认订单，不需要用户手动点击
            autoConfirmOrder(orderIdFromUrl);
        } else if (paymentResult === 'cancel') {
            setRechargeMessage('❌ Payment cancelled.');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const [syncTime, setSyncTime] = useState<string>(new Date().toLocaleTimeString());

    // 刷新用户信息并同步到父组件
    const refreshUser = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/auth?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                body: JSON.stringify({ action: 'getUser', userId: user.id })
            });
            const data = await res.json();
            if (data.user) {
                // 通过回调同步更新父组件的 user 状态
                onUserUpdate?.({ ...user, credits: data.user.credits });
                setSyncTime(new Date().toLocaleTimeString());
                console.log('[MemberView] Force synced credits:', data.user.credits);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // 兑换码兑换
    const handleRedeem = async () => {
        if (!redeemCode.trim()) return;
        setLoading(true);
        setMessage('');

        try {
            const deviceId = localStorage.getItem('device_id') || '';
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'redeem',
                    userId: user.id,
                    code: redeemCode.toUpperCase(),
                    deviceId
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessage('🎉 ' + data.message);
            setRedeemCode('');
            refreshUser();
        } catch (err: any) {
            setMessage('❌ ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 复制分享链接
    const copyShareLink = () => {
        navigator.clipboard.writeText(getShareLink());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 积分兑换申请
    const handlePointsRedeem = async (pointsUsed: number, rewardAmount: number) => {
        if (userPoints < pointsUsed) {
            setPointsMessage('❌ Insufficient points');
            return;
        }

        setPointsMessage('Submitting...');

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'redeemPoints',
                    userId: user.id,
                    pointsUsed,
                    rewardAmount
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setPointsMessage(`🎉 ${data.message}. Please contact us at "${config.contact_email || 'chanlindong9@gmail.com'}" to complete the redemption.`);
        } catch (err: any) {
            setPointsMessage('❌ ' + err.message);
        }
    };

    // 处理充值 - 使用 Stripe Checkout
    const handleRecharge = async (amount: number, creditsToAdd: number) => {
        setRechargeMessage('Creating order...');

        try {
            const res = await fetch('/api/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'createCheckoutSession',
                    userId: user.id,
                    amount,
                    credits: creditsToAdd
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // 保存订单ID用于返回后确认
            localStorage.setItem('pending_order_id', data.orderId);
            setPendingOrderId(data.orderId);

            setRechargeMessage('Redirecting to payment...');

            // 跳转到 Stripe Checkout 页面
            window.location.href = data.payUrl;
        } catch (err: any) {
            setRechargeMessage('❌ ' + (err.message || 'Payment failed'));
        }
    };

    // NOTE: 支付成功后自动确认订单（无需用户手动点击）
    const autoConfirmOrder = async (orderId: string) => {
        try {
            const res = await fetch('/api/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'confirmOrder',
                    orderId,
                    userId: user.id
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setRechargeMessage(`❌ Auto-confirm failed: ${data.error || 'Unknown error'}. Try clicking confirm below.`);
                return;
            }

            setRechargeMessage(`✅ Payment confirmed! ${data.credits} credits added. Refreshing...`);
            localStorage.removeItem('pending_order_id');
            // NOTE: 强制刷新页面以获取最新额度数据
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            setRechargeMessage(`❌ Auto-confirm error: ${err.message}. Try clicking confirm below.`);
        }
    };

    // 确认支付（手动备用方案）
    const confirmPayment = async () => {
        if (!pendingOrderId) return;

        setLoading(true);
        setRechargeMessage('Confirming payment...');

        try {
            const res = await fetch('/api/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'confirmOrder',
                    orderId: pendingOrderId,
                    userId: user.id
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setRechargeMessage(`✅ ${data.message}, ${data.credits} credits added! Refreshing...`);
            localStorage.removeItem('pending_order_id');
            // NOTE: 强制刷新页面以获取最新额度数据
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            setRechargeMessage('❌ ' + (err.message || 'Confirmation failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">Member Center</h2>
            </div>

            <div className="space-y-4">
                {/* 用户信息卡片 */}
                <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl">
                            👤
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">@{user?.username}</h3>
                            <p className="text-white/80 text-xs">Device ID: {getDeviceIdSuffix()}</p>
                        </div>
                    </div>
                    <div className="mt-3 bg-black/10 rounded-xl px-3 py-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-white/80 text-sm">Remaining Credits</span>
                            <span className="text-xl font-bold">{user?.credits || 0}</span>
                        </div>
                        <div className="flex justify-between items-start pt-1 border-t border-white/10 mt-1">
                            <div className="text-[10px] text-white/60 font-mono break-all pr-4">
                                ID: {user?.id}
                            </div>
                            <button
                                onClick={refreshUser}
                                disabled={loading}
                                className="flex-shrink-0 text-white/80 hover:text-white transition-all p-1"
                                title="Sync data"
                            >
                                {loading ? (
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span className="text-xs flex items-center gap-1">🔄 {syncTime}</span>
                                )}
                            </button>
                        </div>
                        {/* 临时调试：确认 credits 字段是否正确 */}
                        <div className="text-[10px] text-white/20 font-mono mt-1 break-all p-1 bg-black/10 rounded">
                            RAW: {JSON.stringify(user)}
                        </div>
                    </div>
                </div>

                {/* 分享获客 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">📤 Share & Earn Credits</h4>
                        <span className="text-sm text-pink-500 font-bold">Earned: {referralCount}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                        Share your link. When a friend registers via <span className="text-pink-500 font-bold">mobile browser</span>, you earn 1 credit. <span className="text-orange-500">⚠️ Registration must be through a mobile browser to qualify.</span>
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={getShareLink()}
                            readOnly
                            className="flex-1 h-10 px-3 rounded-xl bg-gray-100 text-sm"
                        />
                        <button
                            onClick={copyShareLink}
                            className="px-4 h-10 bg-pink-500 text-white rounded-xl text-sm"
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* 推荐奖励积分 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">⭐ Referral Points</h4>
                        <span className="text-sm text-purple-500 font-bold">Points: {userPoints}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                        When friends register via your link in a <span className="text-pink-500 font-bold">mobile browser</span>, you earn <span className="text-purple-500 font-bold">1 point</span>. Points can be redeemed for rewards.
                    </p>
                    <div className="bg-purple-50 rounded-xl p-3 mb-3">
                        <p className="text-xs text-purple-700 mb-1">🎁 Rewards:</p>
                        <p className="text-xs text-purple-600">• 50 points → $4 reward &nbsp;&nbsp; • 100 points → $10 reward</p>
                        <p className="text-xs text-blue-500 mt-1">💡 Note: Only mobile browser registrations count.</p>
                        <p className="text-xs text-orange-500 mt-2">⚠️ After clicking redeem, please contact "{config.contact_email || 'chanlindong9@gmail.com'}" to complete.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handlePointsRedeem(50, 4)}
                            disabled={userPoints < 50}
                            className={`h-16 rounded-xl border-2 transition-colors ${userPoints >= 50 ? 'border-purple-300 hover:border-purple-500 hover:bg-purple-50' : 'border-gray-200 opacity-50 cursor-not-allowed'}`}
                        >
                            <div className="text-lg font-bold text-purple-500">50 pts</div>
                            <div className="text-xs text-gray-500">→ $4 reward</div>
                        </button>
                        <button
                            onClick={() => handlePointsRedeem(100, 10)}
                            disabled={userPoints < 100}
                            className={`h-16 rounded-xl border-2 transition-colors ${userPoints >= 100 ? 'border-purple-300 hover:border-purple-500 hover:bg-purple-50' : 'border-gray-200 opacity-50 cursor-not-allowed'}`}
                        >
                            <div className="text-lg font-bold text-purple-500">100 pts</div>
                            <div className="text-xs text-gray-500">→ $10 reward</div>
                        </button>
                    </div>
                    {pointsMessage && (
                        <p className={`mt-3 text-sm text-center ${pointsMessage.includes('❌') ? 'text-red-500' : 'text-green-500'}`}>
                            {pointsMessage}
                        </p>
                    )}
                </div>

                {/* 充值 (根据后台开关显示) */}
                {config.recharge_enabled === 'true' && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <h4 className="font-bold mb-2">💰 Buy Credits</h4>

                        {/* 待确认订单提示 */}
                        {pendingOrderId && (
                            <div className="mb-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                                <p className="text-sm text-yellow-700 mb-2">📌 You have a pending order</p>
                                <button
                                    onClick={confirmPayment}
                                    disabled={loading}
                                    className="w-full h-10 bg-yellow-500 text-white rounded-xl font-bold"
                                >
                                    {loading ? 'Confirming...' : 'Already paid? Click to confirm'}
                                </button>
                            </div>
                        )}

                        {/* 测试充值按钮 - 测试完成后删除 */}
                        <button
                            onClick={() => handleRecharge(1.00, 1)}
                            className="w-full h-14 mb-3 rounded-xl border-2 border-red-300 hover:border-red-500 hover:bg-red-50 transition-colors"
                        >
                            <div className="text-lg font-bold text-red-500">🧪 Test - 1 Credit</div>
                            <div className="text-xs text-gray-500">$1.00 (test only)</div>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleRecharge(1.99, 12)}
                                className="h-20 rounded-xl border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-colors"
                            >
                                <div className="text-2xl font-bold text-pink-500">12 Credits</div>
                                <div className="text-sm text-gray-500">$1.99</div>
                            </button>
                            <button
                                onClick={() => handleRecharge(3.99, 30)}
                                className="h-20 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                            >
                                <div className="text-2xl font-bold text-purple-500">30 Credits</div>
                                <div className="text-sm text-gray-500">$3.99</div>
                            </button>
                        </div>
                        {rechargeMessage && (
                            <p className="mt-3 text-sm text-center text-orange-500">{rechargeMessage}</p>
                        )}
                    </div>
                )}

                {/* 兑换码 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h4 className="font-bold mb-2">🎁 Redeem Code</h4>
                    <p className="text-xs text-gray-400 mb-1">
                        Each code gives you <span className="text-pink-500 font-bold">5 free</span> credits. One redemption per month.
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                        Contact "<span className="text-pink-500">{config.contact_email || 'chanlindong9@gmail.com'}</span>" to get a free redeem code.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={redeemCode}
                            onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                            placeholder="Enter redeem code"
                            className="flex-1 h-10 px-3 rounded-xl border border-gray-200"
                            maxLength={9}
                        />
                        <button
                            onClick={handleRedeem}
                            disabled={loading}
                            className="px-4 h-10 bg-purple-500 text-white rounded-xl text-sm"
                        >
                            {loading ? '...' : 'Redeem'}
                        </button>
                    </div>
                    {message && (
                        <p className={`mt-2 text-sm ${message.includes('❌') ? 'text-red-500' : 'text-green-500'}`}>
                            {message}
                        </p>
                    )}
                </div>

                {/* 退出登录 */}
                <button
                    onClick={onLogout}
                    className="w-full h-12 border border-gray-200 rounded-2xl text-gray-500"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default MemberView;
