import React, { useState, useEffect } from 'react';

interface MemberViewProps {
    user: any;
    onLogout: () => void;
    onBack: () => void;
    onUserUpdate?: (user: any) => void; // For syncing user state with parent component
}

const MemberView: React.FC<MemberViewProps> = ({ user, onLogout, onBack, onUserUpdate }) => {
    // NOTE: Directly using user.credits, no longer maintaining independent local state to avoid state desynchronization.
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

    // Get last 6 digits of device ID
    const getDeviceIdSuffix = (): string => {
        const deviceId = localStorage.getItem('device_id') || '';
        return deviceId.slice(-6).toUpperCase();
    };

    // Generate share link
    const getShareLink = (): string => {
        const baseUrl = window.location.origin;
        return `${baseUrl}?ref=${user?.id}&d=${getDeviceIdSuffix()}`;
    };

    // Load config
    useEffect(() => {
        fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getConfig' })
        })
            .then(res => res.json())
            .then(data => setConfig(data.config || {}))
            .catch(console.error);

        // Load referral stats
        if (user?.id) {
            fetch(`/api/auth_v2?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getReferralStats', userId: user.id })
            })
                .then(res => res.json())
                .then(data => setReferralCount(data.referralCount || 0))
                .catch(console.error);

            // Load points
            fetch(`/api/auth_v2?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getPointsStats', userId: user.id })
            })
                .then(res => res.json())
                .then(data => setUserPoints(data.points || 0))
                .catch(console.error);
        }

        // Check for pending orders (including Stripe redirect scenarios)
        const savedOrderId = localStorage.getItem('pending_order_id');
        if (savedOrderId) {
            setPendingOrderId(savedOrderId);
        }

        // Check payment results from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const paymentResult = urlParams.get('payment');
        const orderIdFromUrl = urlParams.get('order_id');
        if (paymentResult === 'success' && orderIdFromUrl) {
            setPendingOrderId(orderIdFromUrl);
            localStorage.setItem('pending_order_id', orderIdFromUrl);
            setRechargeMessage('⏳ Confirming payment, please wait...');
            // Clear URL parameters
            window.history.replaceState({}, '', window.location.pathname);
            // NOTE: Auto-confirm order after successful payment, no manual check needed
            autoConfirmOrder(orderIdFromUrl);
        } else if (paymentResult === 'cancel') {
            setRechargeMessage('❌ Payment cancelled.');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const [syncTime, setSyncTime] = useState<string>(new Date().toLocaleTimeString());

    // Refresh user info and sync to parent component
    const refreshUser = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/auth_v2?t=${Date.now()}&r=${Math.random()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                body: JSON.stringify({ action: 'getUser', userId: user.id })
            });
            const data = await res.json();
            if (data.user) {
                // Sync parent user state via callback
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

    // Redeem code
    const handleRedeem = async () => {
        if (!redeemCode.trim()) return;
        setLoading(true);
        setMessage('');

        try {
            const deviceId = localStorage.getItem('device_id') || '';
            const res = await fetch(`/api/auth_v2?t=${Date.now()}`, {
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

    // Copy share link
    const copyShareLink = () => {
        navigator.clipboard.writeText(getShareLink());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Points redemption request
    const handlePointsRedeem = async (pointsUsed: number, rewardAmount: number) => {
        if (userPoints < pointsUsed) {
            setPointsMessage('❌ Insufficient points');
            return;
        }

        setPointsMessage('Submitting...');

        try {
            const res = await fetch('/api/auth_v2', {
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

    // Handle recharge (Creem)
    const handleRecharge = async (amount: number, creditsToAdd: number) => {
        setRechargeMessage('Creating order...');

        try {
            // Get correct Product ID based on amount
            const productId = amount === 5
                ? 'prod_3ZLKsrhpAv5ZgYcSEuNsLF' // I'll use hardcoded IDs as fallback or if env not available in frontend
                : 'prod_44pSRpkGZJlBVsIJ7rqkXJ';

            const res = await fetch('/api/creem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'createCheckout',
                    userId: user.id,
                    productId: productId,
                    amount,
                    credits: creditsToAdd
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Save order ID for confirmation after redirect
            localStorage.setItem('pending_order_id', data.orderId);
            setPendingOrderId(data.orderId);

            setRechargeMessage('Redirecting to Creem Checkout...');
            // Redirect to Creem Checkout URL
            window.location.href = data.checkoutUrl;
        } catch (err: any) {
            setRechargeMessage('❌ ' + (err.message || 'Payment failed'));
        }
    };

    // NOTE: Auto-confirm order after success
    const autoConfirmOrder = async (orderId: string) => {
        try {
            const res = await fetch('/api/creem', {
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

            if (data.success) {
                setRechargeMessage(`✅ Payment confirmed! ${data.credits} credits added. Refreshing...`);
                localStorage.removeItem('pending_order_id');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setRechargeMessage(`⏳ ${data.message}`);
            }
        } catch (err: any) {
            setRechargeMessage(`❌ Auto-confirm error: ${err.message}. Try clicking confirm below.`);
        }
    };

    // Confirm payment (manual backup solution)
    const confirmPayment = async () => {
        if (!pendingOrderId) return;

        setLoading(true);
        setRechargeMessage('Checking payment status...');

        try {
            const res = await fetch('/api/creem', {
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

            if (data.success) {
                setRechargeMessage(`✅ Payment confirmed! ${data.credits} credits added. Refreshing...`);
                localStorage.removeItem('pending_order_id');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setRechargeMessage(`⏳ ${data.message}`);
            }
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
                {/* User Info Card */}
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
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white/80 text-sm">Remaining Credits</span>
                            <span className="text-white text-3xl font-bold">{user?.credits || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Referral Program */}
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

                {/* Referral Points */}
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

                {/* Recharge (Shown based on config) */}
                {config.recharge_enabled === 'true' && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <h4 className="font-bold mb-3">💰 Buy Credits</h4>

                        {/* Pending Order Notice */}
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

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleRecharge(5, 12)}
                                className="h-20 rounded-xl border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-colors"
                            >
                                <div className="text-2xl font-bold text-pink-500">12 Credits</div>
                                <div className="text-sm text-gray-500">$5</div>
                            </button>
                            <button
                                onClick={() => handleRecharge(10, 30)}
                                className="h-20 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                            >
                                <div className="text-2xl font-bold text-purple-500">30 Credits</div>
                                <div className="text-sm text-gray-500">$10</div>
                            </button>
                        </div>
                        {rechargeMessage && (
                            <p className="mt-3 text-sm text-center text-orange-500">{rechargeMessage}</p>
                        )}
                    </div>
                )}

                {/* Redeem Code */}
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

                {/* Log Out */}
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
