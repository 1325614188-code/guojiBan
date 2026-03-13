import React, { useState, useEffect } from 'react';
import { useTranslation, Language } from '../lib/i18n';
import { API_BASE } from '../lib/config';

interface MemberViewProps {
    user: any;
    onLogout: () => void;
    onBack: () => void;
    onUserUpdate?: (user: any) => void;
}

const MemberView: React.FC<MemberViewProps> = ({ user, onLogout, onBack, onUserUpdate }) => {
    const { t, lang } = useTranslation();
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
    
    // 客服聊天状态
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const getDeviceIdSuffix = (): string => {
        const deviceId = localStorage.getItem('device_id') || '';
        return deviceId.slice(-6).toUpperCase();
    };

    const getShareLink = (): string => {
        const baseUrl = 'https://www.sysmm.xyz';
        return `${baseUrl}?ref=${user?.id}&d=${getDeviceIdSuffix()}`;
    };

    useEffect(() => {
        fetch(`${API_BASE}/api/admin?t=${Date.now()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getConfig' })
        })
            .then(res => res.json())
            .then(data => setConfig(data.config || {}))
            .catch(console.error);

        if (user?.id) {
            fetch(`/api/auth_v2?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getReferralStats', userId: user.id })
            })
                .then(res => res.json())
                .then(data => setReferralCount(data.referralCount || 0))
                .catch(console.error);

            fetch(`/api/auth_v2?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getPointsStats', userId: user.id })
            })
                .then(res => res.json())
                .then(data => setUserPoints(data.points || 0))
                .catch(console.error);
        }

        const savedOrderId = localStorage.getItem('pending_order_id');
        if (savedOrderId) {
            setPendingOrderId(savedOrderId);
        }
    }, [user?.id]);

    // 聊天消息拉取逻辑
    const fetchMessages = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/auth_v2?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getMessages', userId: user.id })
            });
            const data = await res.json();
            if (data.success) {
                setChatMessages(data.messages);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    // 监听聊天窗口打开时的轮询
    useEffect(() => {
        let interval: any;
        if (showChat && user?.id) {
            fetchMessages(); // 初始拉取
            interval = setInterval(fetchMessages, 5000); // 每5秒轮询新消息
        }
        return () => clearInterval(interval);
    }, [showChat, user?.id]);

    // 滚动到最新消息
    useEffect(() => {
        if (showChat) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showChat]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !user?.id) return;
        
        const content = chatInput.trim();
        setChatInput('');
        setChatLoading(true);

        // 乐观更新 UI
        const optimisticMsg = {
            id: 'temp-' + Date.now(),
            user_id: user.id,
            sender_type: 'user',
            content,
            created_at: new Date().toISOString(),
            is_read: false
        };
        setChatMessages(prev => [...prev, optimisticMsg]);

        try {
            const res = await fetch(`${API_BASE}/api/auth_v2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sendMessage', userId: user.id, content })
            });
            const data = await res.json();
            if (data.success) {
                fetchMessages(); // 重新拉取确认真实数据
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            // 这里可以加一个发送失败的提示
        } finally {
            setChatLoading(false);
        }
    };

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
                onUserUpdate?.({ ...user, credits: data.user.credits });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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

    const copyShareLink = () => {
        navigator.clipboard.writeText(getShareLink());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWithdrawal = async () => {
        if ((user?.commission_unsettled || 0) < 20) {
            setMessage('❌ ' + t('min_withdrawal_tip'));
            return;
        }

        setLoading(true);
        setMessage('...');

        try {
            const res = await fetch(`${API_BASE}/api/auth_v2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'requestWithdrawal',
                    userId: user.id,
                    amount: user.commission_unsettled
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMessage('🎉 ' + t('withdrawal_success'));
            // Optional: refresh user to see pending status if implemented
        } catch (err: any) {
            setMessage('❌ ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePointsRedeem = async (pointsUsed: number, rewardAmount: number) => {
        if (userPoints < pointsUsed) {
            setPointsMessage('❌ ' + t('insufficient_credits'));
            return;
        }

        setPointsMessage('...');

        try {
            const res = await fetch(`${API_BASE}/api/auth_v2`, {
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

            setPointsMessage(`🎉 ${data.message}. ${t('contact_support')}`);
        } catch (err: any) {
            setPointsMessage('❌ ' + err.message);
        }
    };

    const handleRecharge = async (amount: number, creditsToAdd: number) => {
        setRechargeMessage('...');
        try {
            const productId = amount === 5 ? 'prod_7jbvR7bVfcXC4LZVZ7nKCp' : 'prod_3QknshZWwWAE5HuwwnwBLi';
            const res = await fetch(`${API_BASE}/api/creem`, {
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

            localStorage.setItem('pending_order_id', data.orderId);
            window.location.href = data.checkoutUrl;
        } catch (err: any) {
            setRechargeMessage('❌ ' + (err.message || 'Error'));
        }
    };

    const confirmPayment = async () => {
        if (!pendingOrderId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/creem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'confirmOrder', orderId: pendingOrderId, userId: user.id })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.removeItem('pending_order_id');
                window.location.reload();
            }
        } catch (err: any) {
            setRechargeMessage('❌ Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-2xl">←</button>
                <h2 className="text-xl font-bold">{t('member_center')}</h2>
            </div>

            <div className="space-y-4">
                {/* User Card */}
                <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-3xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">👤</div>
                        <div>
                            <h3 className="text-xl font-bold">@{user?.username}</h3>
                            <p className="text-white/70 text-xs font-mono">{t('device_id')}: {getDeviceIdSuffix()}</p>
                        </div>
                    </div>
                    <div className="bg-black/10 rounded-2xl p-4 flex justify-between items-center backdrop-blur-sm">
                        <span className="text-white/80 text-sm">{t('remaining_credits')}</span>
                        <span className="text-3xl font-black">{user?.credits || 0}</span>
                    </div>
                </div>

                {/* Referral Commission */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-orange-200 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">💰</span>
                        <h4 className="font-bold text-orange-900">{t('referral_commission')}</h4>
                    </div>
                    <div className="text-[11px] text-orange-800/80 mb-4 space-y-1">
                        <p>{t('referral_step1')}</p>
                        <p>{t('referral_step2')}</p>
                        <p>{t('referral_step3')}</p>
                    </div>
                    <div className="bg-white/80 rounded-2xl p-4 flex flex-col gap-3 border border-orange-200 shadow-inner">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs">{t('unsettled_commission')}</span>
                            <span className="text-xl font-black text-orange-600">${user?.commission_unsettled || '0.00'}</span>
                        </div>
                        <button
                            onClick={handleWithdrawal}
                            disabled={loading || (user?.commission_unsettled || 0) < 20}
                            className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all shadow-md"
                        >
                            {t('withdraw')}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-3 italic">{t('min_withdrawal_tip')}</p>
                </div>

                {/* Share & Earn */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800">{t('share_earn')}</h4>
                        <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-bold">{t('points')}: {referralCount}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">{t('share_link')}</p>
                    <div className="flex gap-2">
                        <input type="text" value={getShareLink()} readOnly className="flex-1 bg-gray-50 p-3 rounded-xl text-xs border border-gray-100 font-mono" />
                        <button onClick={copyShareLink} className="px-6 bg-pink-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md">{copied ? t('copied') : t('copy')}</button>
                    </div>
                    <p className="text-[10px] text-orange-400 mt-3">{t('share_earn_tip')}</p>
                </div>

                {/* Recharge */}
                {config.recharge_enabled === 'true' && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4">{t('recharge_credits')}</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleRecharge(5, 12)} className="p-4 rounded-2xl border-2 border-pink-50 hover:border-pink-200 transition-all text-center">
                                <div className="text-xl font-black text-pink-500">12</div>
                                <div className="text-xs text-gray-400">$5</div>
                            </button>
                            <button onClick={() => handleRecharge(10, 30)} className="p-4 rounded-2xl border-2 border-purple-50 hover:border-purple-200 transition-all text-center">
                                <div className="text-xl font-black text-purple-500">30</div>
                                <div className="text-xs text-gray-400">$10</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Redeem Code */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-2">{t('redeem_code')}</h4>
                    <p className="text-xs text-gray-400 mb-4">{t('redeem_tip')}</p>
                    <div className="flex gap-2">
                        <input type="text" value={redeemCode} onChange={e => setRedeemCode(e.target.value.toUpperCase())} className="flex-1 bg-gray-50 p-3 rounded-xl text-sm border border-gray-100" />
                        <button onClick={handleRedeem} disabled={loading} className="px-6 bg-gray-800 text-white rounded-xl font-bold disabled:opacity-50">{t('redeem')}</button>
                    </div>
                </div>

                {/* Customer Service / Chat */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                    <div 
                        className="flex justify-between items-center cursor-pointer mb-2" 
                        onClick={() => setShowChat(!showChat)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💬</span>
                            <h4 className="font-bold text-gray-800">联系客服 / Support</h4>
                        </div>
                        <span className={`transform transition-transform ${showChat ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    
                    {showChat && (
                        <div className="mt-4 flex flex-col h-[350px]">
                            {/* Message List */}
                            <div className="flex-1 bg-gray-50 rounded-2xl p-4 overflow-y-auto mb-4 border border-gray-100 space-y-3">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                        <p>有问题随时留言吧~</p>
                                        <p className="text-xs mt-1">Leave a message if you need help.</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg: any) => {
                                        const isUser = msg.sender_type === 'user';
                                        return (
                                            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                                    isUser ? 'bg-pink-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                                }`}>
                                                    <p className="whitespace-pre-wrap word-break-all">{msg.content}</p>
                                                    <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-pink-200' : 'text-gray-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            
                            {/* Input Area */}
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={chatInput} 
                                    onChange={e => setChatInput(e.target.value)} 
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="输入消息..."
                                    className="flex-1 bg-gray-50 p-3 rounded-xl text-sm border border-gray-100 focus:outline-none focus:border-pink-300 transition-colors" 
                                />
                                <button 
                                    onClick={handleSendMessage} 
                                    disabled={chatLoading || !chatInput.trim()} 
                                    className="px-5 bg-pink-500 text-white rounded-xl font-bold disabled:opacity-50 active:scale-95 shadow-md flex items-center justify-center"
                                >
                                    发送
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={onLogout} className="w-full py-4 text-gray-400 text-sm font-medium">{t('logout')}</button>
            </div>
        </div>
    );
};

export default MemberView;
