import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '../lib/api-config';
import { User } from '../types';
import { useTranslation } from 'react-i18next';
import LegalFooter from '../components/LegalFooter';

interface MemberViewProps {
    user: User;
    onLogout: () => void;
    onBack: () => void;
    onUserUpdate?: (user: User) => void;
}

const ScrollingLeaderboard: React.FC<{ title: string; dataString?: string; type: 'gold' | 'silver' }> = ({ title, dataString, type }) => {
    const data = React.useMemo(() => {
        try {
            const parsed = JSON.parse(dataString || '[]');
            return Array.isArray(parsed) ? parsed.filter((item: any) => item.user || item.amount) : [];
        } catch (e) {
            return [];
        }
    }, [dataString]);

    if (data.length === 0) return null;

    const bgClass = type === 'gold' ? 'bg-amber-50 border-amber-200 shadow-[inset_0_0_10px_rgba(251,191,36,0.1)]' : 'bg-gray-50 border-gray-200 shadow-[inset_0_0_10px_rgba(156,163,175,0.1)]';
    const titleClass = type === 'gold' ? 'text-amber-800' : 'text-gray-600';
    const accentClass = type === 'gold' ? 'bg-amber-500/10 text-amber-700' : 'bg-gray-500/10 text-gray-500';

    return (
        <div className={`flex-1 rounded-2xl border ${bgClass} p-3 overflow-hidden h-[180px] flex flex-col relative`}>
            <h5 className={`text-[11px] font-bold mb-3 text-center ${titleClass} flex items-center justify-center gap-1`}>
                {type === 'gold' ? '🏆' : '🥈'} {title}
            </h5>
            <div className="flex-1 overflow-hidden relative">
                <style>{`
                    @keyframes vertical-scroll {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(-50%); }
                    }
                    .animate-vertical-scroll {
                        animation: vertical-scroll 40s linear infinite;
                    }
                    .animate-vertical-scroll:hover {
                        animation-play-state: paused;
                    }
                `}</style>
                <div className="animate-vertical-scroll space-y-2">
                    {/* 重复两遍实现无缝滚动 */}
                    {[...data, ...data].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] py-1.5 border-b border-black/5 last:border-0">
                            <span className={`w-4 h-4 rounded-md flex items-center justify-center font-bold text-[8px] ${accentClass}`}>
                                {(i % data.length) + 1}
                            </span>
                            <span className="flex-1 truncate px-2 text-gray-500 font-medium">@{item.user}</span>
                            <span className="font-bold text-orange-500 shrink-0">${item.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MemberView: React.FC<MemberViewProps> = ({ user, onLogout, onBack, onUserUpdate }) => {
    const { t } = useTranslation();
    const [redeemCode, setRedeemCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [config, setConfig] = useState<any>({});
    const [copied, setCopied] = useState(false);
    const [rechargeMessage, setRechargeMessage] = useState('');
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const [referralCount, setReferralCount] = useState(0);
    const [referralHistory, setReferralHistory] = useState<any[]>([]);
    const [userPoints, setUserPoints] = useState(0);
    const [pointsMessage, setPointsMessage] = useState('');

    // 获取用户ID后6位作为邀请码
    const getInviteCode = (): string => {
        if (!user?.id) return 'UNKNOWN';
        return user.id.slice(-6).toUpperCase();
    };

    const [inviteInput, setInviteInput] = useState('');
    const [inviteMsg, setInviteMsg] = useState('');
    const [bindingInvite, setBindingInvite] = useState(false);

    // 在线客服聊天状态
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
    const [translatingId, setTranslatingId] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);


    // 加载配置和统计
    useEffect(() => {
        const loadStats = async () => {
            try {
                const ts = Date.now();

                // 【问题4修复】将配置、统计、历史、积分 4 个请求合并为并发执行，减少约 75% 等待时间
                const requests: Promise<Response>[] = [
                    // 0: 获取配置
                    fetch(getApiUrl('/api/admin'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'getConfig' })
                    }),
                ];

                if (user?.id) {
                    // 1: 分享统计
                    requests.push(fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'getReferralStats', userId: user.id })
                    }));
                    // 2: 推荐历史
                    requests.push(fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'getReferralHistory', userId: user.id })
                    }));
                    // 3: 积分
                    requests.push(fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'getPointsStats', userId: user.id })
                    }));
                }

                // NOTE: 使用 allSettled 替代 all，确保单个请求失败不影响其他请求的结果
                const results = await Promise.allSettled(requests);

                // 处理配置
                if (results[0].status === 'fulfilled' && results[0].value.ok) {
                    const adminData = await results[0].value.json();
                    setConfig(adminData.config || {});
                }

                if (user?.id) {
                    // 处理分享统计
                    if (results[1]?.status === 'fulfilled' && results[1].value.ok) {
                        const statsData = await results[1].value.json();
                        setReferralCount(statsData.referralCount || 0);
                    }
                    // 处理推荐历史
                    if (results[2]?.status === 'fulfilled' && results[2].value.ok) {
                        const historyData = await results[2].value.json();
                        setReferralHistory(historyData.history || []);
                    }
                    // 处理积分
                    if (results[3]?.status === 'fulfilled' && results[3].value.ok) {
                        const pointsData = await results[3].value.json();
                        setUserPoints(pointsData.points || 0);
                    }
                }
            } catch (err) {
                console.error('Failed to load member stats:', err);
            }
        };

        loadStats();

        // 【复刻备份】支付返回检查：检查 URL 中是否存在订单号
        const params = new URLSearchParams(window.location.search);
        const urlOrderId = params.get('order_id') || params.get('orderId'); // 兼容两种拼写
        if (urlOrderId && urlOrderId.startsWith('CR')) {
            localStorage.setItem('pending_order_id', urlOrderId);
            setPendingOrderId(urlOrderId);
            // 清理 URL 参数防止刷新时重复触发
            const newUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);
        } else {
            const savedOrderId = localStorage.getItem('pending_order_id');
            if (savedOrderId) setPendingOrderId(savedOrderId);
        }
    }, [user?.id]);

    // 在线客服：加载消息
    const loadChatMessages = useCallback(async () => {
        if (!user?.id) return;
        try {
            const ts = Date.now();
            const res = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getSupportMessages', userId: user.id })
            });
            const data = await res.json();
            if (data.messages) {
                setChatMessages(data.messages);
                const unread = data.messages.filter((m: any) => m.sender_type === 'admin' && !m.is_read).length;
                setUnreadCount(unread);
            }
        } catch (e) {
            console.error('[Chat] Load messages failed:', e);
        }
    }, [user?.id]);

    // 打开聊天窗口时加载消息并开启轮询
    useEffect(() => {
        if (chatOpen && user?.id) {
            loadChatMessages();
            // 标记管理员消息为已读
            fetch(getApiUrl('/api/auth_v2'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markMessagesAsRead', userId: user.id })
            }).then(() => setUnreadCount(0));
            // 每 5 秒轮询新消息
            chatPollRef.current = setInterval(loadChatMessages, 5000);
        }
        return () => {
            if (chatPollRef.current) clearInterval(chatPollRef.current);
        };
    }, [chatOpen, user?.id, loadChatMessages]);

    // 自动滚动到底部
    useEffect(() => {
        if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, chatOpen]);

    // 首次加载获取未读数
    useEffect(() => {
        if (user?.id) loadChatMessages();
    }, [user?.id, loadChatMessages]);

    /**
     * 发送客服消息
     */
    const handleSendChat = async () => {
        if (!chatInput.trim() || !user?.id || chatLoading) return;
        setChatLoading(true);
        try {
            const ts = Date.now();
            const res = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sendSupportMessage', userId: user.id, content: chatInput.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setChatInput('');
                loadChatMessages();
            }
        } catch (e) {
            console.error('[Chat] Send failed:', e);
        } finally {
            setChatLoading(false);
        }
    };

    /**
     * 使用免费 Google Translate API 翻译消息
     * NOTE: 使用非官方 gtx 端点，无需 API Key
     */
    const handleTranslate = async (msgId: string, text: string) => {
        if (translatedMessages[msgId]) {
            setTranslatedMessages(prev => {
                const next = { ...prev };
                delete next[msgId];
                return next;
            });
            return;
        }
        setTranslatingId(msgId);
        try {
            // 优先使用当前应用语言，回退到系统语言
            const currentLang = i18n.language || navigator.language;
            const targetLang = currentLang.split('-')[0] || 'en';
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            const data = await res.json();
            const translated = data[0]?.map((item: any) => item[0]).join('') || text;
            setTranslatedMessages(prev => ({ ...prev, [msgId]: translated }));
        } catch (e) {
            console.error('[Translate] Failed:', e);
        } finally {
            setTranslatingId(null);
        }
    };


    // 支付查询逻辑
    useEffect(() => {
        if (!pendingOrderId) return;
        let pollCount = 0;
        const maxPolls = 100;

        const pollStatus = async () => {
            if (pollCount >= maxPolls) {
                setRechargeMessage('⚠️ 支付超时，请联系客服');
                localStorage.removeItem('pending_order_id');
                setPendingOrderId(null);
                return;
            }
            pollCount++;

            try {
                const ts = Date.now();
                const isCreem = pendingOrderId.startsWith('CR');
                const apiUrl = isCreem ? '/api/creem' : '/api/alipay';
                const action = isCreem ? 'confirmOrder' : 'checkOrder';

                const res = await fetch(getApiUrl(`${apiUrl}?t=${ts}`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action, orderId: pendingOrderId })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'paid') {
                        setRechargeMessage(`✅ 充值成功！自动为您增加了 ${data.credits} 次额度`);
                        localStorage.removeItem('pending_order_id');
                        setPendingOrderId(null);
                        setTimeout(() => refreshUser(), 2000);
                    }
                }
            } catch (err) { console.error(err); }
        };

        const timer = setInterval(pollStatus, 3000);
        return () => clearInterval(timer);
    }, [pendingOrderId]);

    const refreshUser = async () => {
        try {
            if (!user?.id) return;
            const ts = Date.now();
            const res = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getUser', userId: user.id })
            });
            const data = await res.json();
            if (data.user) onUserUpdate?.(data.user);
        } catch (e) { console.error(e); }
    };

    const handleRedeem = async () => {
        if (!redeemCode.trim() || !user?.id) return;
        setLoading(true);
        setMessage('');
        try {
            const deviceId = localStorage.getItem('device_id') || '';
            const ts = Date.now();
            const res = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'redeem', userId: user.id, code: redeemCode.toUpperCase(), deviceId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage('🎉 ' + (data.message || t('common.success')));
            setRedeemCode('');
            refreshUser();
        } catch (err: any) { setMessage('❌ ' + (err.message || t('common.error'))); } finally { setLoading(false); }
    };


    const handlePointsRedeem = async (pointsUsed: number, rewardAmount: number) => {
        if (userPoints < pointsUsed || !user?.id) return;
        setPointsMessage('提交中...');
        try {
            const ts = Date.now();
            const res = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'redeemPoints', userId: user.id, pointsUsed, rewardAmount })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setPointsMessage(`🎉 ${data.message}`);
        } catch (err: any) { setPointsMessage('❌ ' + err.message); }
    };

    const handleAlipay = async (amount: number, creditsToAdd: number) => {
        if (!config.alipay_app_id || !config.alipay_private_key) {
            setRechargeMessage('⚠️ 支付宝功能配置中，请联系管理员');
            return;
        }
        setRechargeMessage(`正在创建支付宝订单...`);
        try {
            const res = await fetch(getApiUrl('/api/alipay'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'createOrder', userId: user.id, amount, credits: creditsToAdd })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            localStorage.setItem('pending_order_id', data.orderId);
            setPendingOrderId(data.orderId);
            setRechargeMessage('正在跳转支付宝...');
            window.location.href = data.payUrl;
        } catch (err: any) { setRechargeMessage('❌ ' + (err.message || '支付失败')); }
    };

    const handleCreem = async (amount: number, creditsToAdd: number) => {
        setRechargeMessage('正在创建国际支付收银台...');
        try {
            // 参数对齐备份：根据金额确定 Product ID
            const productId = amount === 5 ? 'prod_7jbvR7bVfcXC4LZVZ7nKCp' : 'prod_3QknshZWwWAE5HuwwnwBLi';
            
            const res = await fetch(getApiUrl('/api/creem'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'createCheckout', 
                    userId: user.id, 
                    amount, 
                    productId,
                    credits: creditsToAdd 
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            localStorage.setItem('pending_order_id', data.orderId);
            setPendingOrderId(data.orderId); // 开启轮询逻辑
            setRechargeMessage('收银台已准备就绪，正在跳转...');
            window.location.href = data.checkoutUrl;
        } catch (err: any) { 
            setRechargeMessage('❌ ' + (err.message || 'Payment Service Error')); 
        }
    };



    const [showPaySelect, setShowPaySelect] = useState<{amount: number, credits: number} | null>(null);

    const handleRechargeClick = (amount: number, credits: number) => {
        const alipayEnabled = config.alipay_app_id && config.alipay_private_key;
        const creemEnabled = config.creem_payment_enabled !== 'false';

        if (alipayEnabled && creemEnabled) {
            setShowPaySelect({ amount, credits });
        } else if (alipayEnabled) {
            handleAlipay(amount, credits);
        } else if (creemEnabled) {
            handleCreem(amount, credits);
        } else {
            setRechargeMessage('⚠️ 充值通道暂时关闭，请联系客服');
        }
    };

    const [withdrawalMessage, setWithdrawalMessage] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    const handleWithdrawal = async () => {
        const balance = Number(user?.commission_balance || 0);
        if (balance < 20) {
            setWithdrawalMessage('❌ 佣金满 20 美元即可申请提现哦');
            setTimeout(() => setWithdrawalMessage(''), 3000);
            return;
        }

        if (!confirm(`确认申请提现全部佣金 $${balance} 吗？`)) return;

        setWithdrawing(true);
        setWithdrawalMessage('提交申请中...');
        try {
            const ts = Date.now();
            const res = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'requestCommissionWithdrawal', userId: user.id, amount: balance })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setWithdrawalMessage('🎉 ' + data.message);
            setTimeout(() => {
                setWithdrawalMessage('');
                refreshUser();
            }, 3000);
        } catch (err: any) {
            setWithdrawalMessage('❌ ' + err.message);
            setTimeout(() => setWithdrawalMessage(''), 3000);
        } finally {
            setWithdrawing(false);
        }
    };

    const handleBindInvite = async () => {
        if (!inviteInput || inviteInput.length < 6) {
            setInviteMsg('❌ 请输入6位邀请码');
            return;
        }
        setBindingInvite(true);
        setInviteMsg('');
        try {
            const deviceId = localStorage.getItem('device_id') || '';
            const ts = Date.now();
            const res = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'bindInviteCode', 
                    userId: user.id, 
                    inviteCode: inviteInput.trim(),
                    deviceId 
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setInviteMsg('✅ ' + data.message);
            if (onUserUpdate) {
                // 刷新用户信息以获得最新额度
                refreshUser();
            }
        } catch (err: any) {
            setInviteMsg('❌ ' + err.message);
        } finally {
            setBindingInvite(false);
        }
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-2xl p-2 active:bg-pink-50 rounded-full transition-colors">←</button>
                <h2 className="text-xl font-bold">{t('member.title')}</h2>
            </div>

            <div className="space-y-4">
                {/* 用户信息卡片 */}
                <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl p-4 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl">👤</div>
                        <div>
                            <h3 className="text-lg font-bold">@{user?.username || 'User'}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-white/80 text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                                    {t('member.your_invite_code')}: <span className="font-black text-white">{getInviteCode()}</span>
                                </span>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(getInviteCode()).then(() => {
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        });
                                    }}
                                    className="text-[10px] bg-white text-pink-500 px-2 py-0.5 rounded-full font-bold active:scale-90 transition-all"
                                >
                                    {copied ? t('member.copied') : t('member.copy')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <div onClick={refreshUser} className="flex-1 bg-black/10 rounded-xl px-3 py-2 flex flex-col items-center cursor-pointer hover:bg-black/20 transition-all">
                            <span className="text-white/60 text-[10px]">{t('member.remaining_credits')}</span>
                            <span className="text-lg font-bold">{user?.credits || 0}</span>
                        </div>
                        <div onClick={refreshUser} className="flex-1 bg-black/10 rounded-xl px-3 py-2 flex flex-col items-center cursor-pointer hover:bg-black/20 transition-all">
                            <span className="text-white/60 text-[10px]">{t('member.referral_income')}</span>
                            <span className="text-lg font-bold">${user?.commission_balance || '0.00'}</span>
                        </div>
                        <div onClick={refreshUser} className="flex-1 bg-black/10 rounded-xl px-3 py-2 flex flex-col items-center cursor-pointer hover:bg-black/20 transition-all">
                            <span className="text-white/60 text-[10px]">{t('member.reward_points')}</span>
                            <span className="text-lg font-bold">{user?.points || 0}</span>
                        </div>
                    </div>
                </div>

                {/* 我的邀请码专栏 (更加醒目) */}
                {config.referral_program_enabled !== 'false' && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-pink-100 flex flex-col gap-3 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold flex items-center gap-2">
                                🔗 {t('member.your_invite_code')}
                            </h4>
                            <div className="text-[10px] text-pink-500 bg-pink-50 px-2 py-1 rounded-lg">
                                {t('member.invite_reward_tip')}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-dashed border-pink-200">
                            <div className="flex-1">
                                <span className="text-[10px] text-gray-400 block mb-1">{t('member.referral_step1_title')}</span>
                                <span className="text-2xl font-black text-pink-500 tracking-wider font-mono">{getInviteCode()}</span>
                            </div>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(getInviteCode()).then(() => {
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    });
                                }}
                                className="px-6 h-12 bg-pink-500 text-white rounded-xl font-bold active:scale-95 transition-all shadow-md"
                            >
                                {copied ? t('member.copied') : t('member.copy')}
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 px-1">
                            <span className="text-xs text-pink-500 font-medium">🎁 {t('member.invite_owner_reward_desc')}</span>
                        </div>
                        
                        {/* 填码领奖入口 (移入此栏目) */}
                        {!user?.invite_bonus_redeemed && (
                            <div className="mt-2 pt-4 border-t border-gray-100">
                                <p className="text-[10px] text-gray-400 mb-2 font-medium">✨ {t('member.invite_reward_title')}</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inviteInput}
                                        onChange={e => setInviteInput(e.target.value.toUpperCase())}
                                        placeholder={t('member.bind_invite_placeholder')}
                                        maxLength={6}
                                        className="flex-1 h-10 px-4 rounded-xl bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white text-sm focus:outline-none transition-all font-mono"
                                    />
                                    <button 
                                        onClick={handleBindInvite} 
                                        disabled={bindingInvite}
                                        className="px-4 h-10 bg-gray-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {bindingInvite ? '...' : t('member.bind_invite_btn')}
                                    </button>
                                </div>
                                {inviteMsg && <p className={`mt-2 text-xs font-medium text-center ${inviteMsg.includes('❌') ? 'text-red-500' : 'text-green-500'}`}>{inviteMsg}</p>}
                            </div>
                        )}
                    </div>
                )}




                {/* 邀请获客 & 推荐计划相关 (受后台开关控制) */}
                {config.referral_program_enabled !== 'false' && (
                    <>

                        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-orange-100">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">💰</span>
                                <h4 className="font-bold">{t('member.referral_plan_title')}</h4>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{t('member.referral_plan_desc')}</p>
                            <div className="space-y-3 bg-orange-50 rounded-xl p-3 text-xs text-orange-800">
                                <p><span className="font-bold">{t('member.referral_step1_title')}</span>：{t('member.referral_step1_desc')}</p>
                                <p><span className="font-bold">{t('member.referral_step2_title')}</span>：{t('member.referral_step2_desc')}</p>
                                <p><span className="font-bold">{t('member.referral_step3_title')}</span>：{t('member.referral_step3_desc', { rate: config.commission_rate || '40' })}</p>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={handleWithdrawal}
                                    disabled={withdrawing}
                                    className={`w-full h-11 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${Number(user?.commission_balance || 0) >= 20 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                                >
                                    <span className="text-lg">💰</span>
                                    {withdrawing ? t('common.loading') : (Number(user?.commission_balance || 0) >= 20 ? t('member.withdrawal_apply') : t('member.withdrawal_status_prefix'))}
                                </button>
                                {withdrawalMessage && <p className={`mt-2 text-center text-xs font-medium ${withdrawalMessage.includes('❌') ? 'text-red-500' : 'text-green-500'}`}>{withdrawalMessage}</p>}
                            </div>


                        </div>

                        <div className="flex gap-3 px-1">
                            <ScrollingLeaderboard 
                                title={t('member.leaderboard_commission')} 
                                dataString={config.commission_leaderboard_data} 
                                type="gold" 
                            />
                            <ScrollingLeaderboard 
                                title={t('member.leaderboard_points')} 
                                dataString={config.points_leaderboard_data} 
                                type="silver" 
                            />
                        </div>
                    </>
                )}


                {/* 在线客服入口 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-blue-50 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                                💬
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">{t('member.contact_service')}</h4>
                                <p className="text-[10px] text-gray-500">{t('member.chat_title')}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setChatOpen(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm"
                        >
                            {t('member.chat_send')}
                        </button>
                    </div>
                </div>

                {/* 积分兑换 */}
                {config.referral_points_enabled === 'true' && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold">⭐ {t('member.points_redeem_title')}</h4>
                            <span className="text-sm text-purple-500 font-bold">{t('member.points_balance_title')}：{userPoints}</span>
                        </div>
                        {/* 积分获取说明 */}
                        <div className="bg-purple-50 rounded-xl p-3 mb-3 text-xs text-purple-700 leading-relaxed">
                            <p className="font-bold mb-1">📣 {t('member.points_how_to_earn')}</p>
                            <p>{t('member.points_earn_desc')}</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-3 mb-3 text-xs text-purple-600">
                            <p>🎁 {config.points_threshold_1 || '50'}{t('common.points')} → {config.points_reward_1 || '20'}{t('member.points_reward_currency', '元')}{t('member.points_reward_type', '红包')} &nbsp;&nbsp; • {config.points_threshold_2 || '100'}{t('common.points')} → {config.points_reward_2 || '50'}{t('member.points_reward_currency', '元')}{t('member.points_reward_type', '红包')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handlePointsRedeem(
                                    Number(config.points_threshold_1 || 50),
                                    Number(config.points_reward_1 || 20)
                                )}
                                disabled={userPoints < Number(config.points_threshold_1 || 50)}
                                className={`h-16 rounded-xl border-2 transition-all ${userPoints >= Number(config.points_threshold_1 || 50) ? 'border-purple-300 active:bg-purple-50' : 'border-gray-200 opacity-50'}`}
                            >
                                <div className="text-lg font-bold text-purple-500">{config.points_threshold_1 || '50'}{t('common.points')}</div>
                                <div className="text-[10px] text-gray-500">{t('member.points_reward_redeem', { reward: config.points_reward_1 || '20' })}</div>
                            </button>
                            <button
                                onClick={() => handlePointsRedeem(
                                    Number(config.points_threshold_2 || 100),
                                    Number(config.points_reward_2 || 50)
                                )}
                                disabled={userPoints < Number(config.points_threshold_2 || 100)}
                                className={`h-16 rounded-xl border-2 transition-all ${userPoints >= Number(config.points_threshold_2 || 100) ? 'border-purple-300 active:bg-purple-50' : 'border-gray-200 opacity-50'}`}
                            >
                                <div className="text-lg font-bold text-purple-500">{config.points_threshold_2 || '100'}{t('common.points')}</div>
                                <div className="text-[10px] text-gray-500">{t('member.points_reward_redeem', { reward: config.points_reward_2 || '50' })}</div>
                            </button>
                        </div>
                        {pointsMessage && <p className="mt-3 text-sm text-center text-purple-500">{pointsMessage}</p>}
                        
                        <div className="mt-4 pt-3 border-t border-purple-50 text-center">
                            <button 
                                onClick={() => setChatOpen(true)}
                                className="text-[11px] text-purple-400 font-medium hover:text-purple-600 transition-colors flex items-center justify-center gap-1 mx-auto"
                            >
                                💬 {t('member.contact_for_redeem', '联系客服兑换积分')} →
                            </button>
                        </div>
                    </div>
                )}


                {/* 充值区 (对齐备份 Premium 风格) */}
                {config.recharge_enabled === 'true' && (
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border-2 border-pink-100/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-100/20 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                        <h4 className="font-black mb-6 text-gray-800 italic flex items-center gap-2">
                             💎 Premium Credits
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleRechargeClick(5, 12)} 
                                className="p-6 rounded-[2rem] bg-pink-50 hover:bg-pink-100 active:scale-95 transition-all text-center group border border-pink-100 shadow-sm"
                            >
                                <div className="text-3xl font-black text-pink-600 mb-1 group-hover:scale-110 transition-transform">12</div>
                                <div className="text-[10px] text-pink-900/40 font-black uppercase tracking-widest">$5 USD</div>
                            </button>
                            <button 
                                onClick={() => handleRechargeClick(10, 30)} 
                                className="p-6 rounded-[2rem] bg-purple-50 hover:bg-purple-100 active:scale-95 transition-all text-center group border border-purple-100 shadow-sm"
                            >
                                <div className="text-3xl font-black text-purple-600 mb-1 group-hover:scale-110 transition-transform">30</div>
                                <div className="text-[10px] text-purple-900/40 font-black uppercase tracking-widest">$10 USD</div>
                            </button>
                        </div>

                        {/* 支付方式选择弹窗 */}
                        {showPaySelect && (
                            <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl z-20 border-t border-pink-50 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-bold text-sm">{t('member.select_payment_method', '选择支付方式')}</h5>
                                    <button onClick={() => setShowPaySelect(null)} className="text-gray-400 text-lg">×</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {config.alipay_app_id && config.alipay_private_key && (
                                        <button 
                                            onClick={() => { handleAlipay(showPaySelect.amount, showPaySelect.credits); setShowPaySelect(null); }}
                                            className="w-full h-12 bg-blue-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            {t('member.alipay', '支付宝支付')}
                                        </button>
                                    )}
                                    {config.creem_payment_enabled !== 'false' && (
                                        <button 
                                            onClick={() => { handleCreem(showPaySelect.amount, showPaySelect.credits); setShowPaySelect(null); }}
                                            className="w-full h-12 bg-pink-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        >
                                            {t('member.creem_pay', 'Creem(国际卡/意)')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {rechargeMessage && <p className="mt-3 text-[10px] text-center text-orange-500 font-medium bg-orange-50 py-2 rounded-lg">{rechargeMessage}</p>}
                    </div>
                )}

                {/* 兑换码 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">🎁 {t('member.redeem_code_title')}</h4>
                        <div className="flex items-center gap-1.5 py-1 px-2.5 bg-blue-50 rounded-lg border border-blue-100 active:bg-blue-100 transition-colors cursor-pointer" 
                             onClick={() => setChatOpen(true)}>
                            <span className="text-[10px] text-blue-600 font-bold">{t('member.contact_service')}</span>
                            <span className="text-[10px] px-1 bg-blue-500 text-white rounded">💬</span>
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                        {t('member.redeem_code_desc', 'member.redeem_code_desc')}
                    </p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={redeemCode}
                            onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                            placeholder={t('member.redeem_placeholder')}
                            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm"
                        />
                        <button onClick={handleRedeem} disabled={loading} className="px-4 h-10 bg-purple-500 text-white rounded-xl text-sm font-bold">
                            {loading ? '...' : t('member.redeem_btn')}
                        </button>
                    </div>
                    {message && <p className={`mt-2 text-sm font-medium ${message.includes('❌') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
                </div>


                <button onClick={onLogout} className="w-full h-12 border border-blue-100 rounded-2xl text-blue-400 font-bold active:bg-blue-50 transition-colors">{t('member.logout_btn')}</button>

                {/* 推荐记录 (受后台开关控制) */}
                {config.referral_program_enabled !== 'false' && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">👥</span>
                            <h4 className="font-bold">{t('member.referral_history')}</h4>
                        </div>
                        {referralHistory.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">{t('member.no_referral_history', '暂无被邀请记录')}</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex text-xs text-gray-400 border-b pb-2">
                                    <div className="flex-1">{t('member.history_user')}</div>
                                    <div className="w-20 text-center shrink-0">{t('member.history_time')}</div>
                                    <div className="w-20 text-center shrink-0">{t('member.history_env')}</div>
                                    <div className="w-16 text-right shrink-0">{t('member.history_amount')}</div>
                                </div>
                                {referralHistory.map((record: any, index: number) => (
                                    <div key={index} className="flex items-center text-sm py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex-1 font-medium text-gray-700 truncate pr-1">{record.username}</div>
                                        <div className="w-20 text-xs text-gray-500 text-center shrink-0">
                                            {new Date(record.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="w-20 text-xs text-center shrink-0">
                                            {record.register_env === 'browser'
                                                ? <span className="text-green-500">✅{t('member.env_browser')}</span>
                                                : (record.register_env === 'unknown' ? <span className="text-gray-400">❓{t('member.env_unknown')}</span> : <span className="text-red-400">❌{t('member.env_other')}</span>)
                                            }
                                        </div>
                                        <div className="w-16 text-right text-orange-500 font-bold shrink-0">
                                            ${(record.total_recharge || 0).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <LegalFooter />
            </div>

            {/* 在线客服浮动按钮 */}
            {!chatOpen && (
                <button
                    onClick={() => setChatOpen(true)}
                    className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl active:scale-90 transition-all z-50"
                    style={{ animation: 'chatPulse 2s infinite' }}
                >
                    💬
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* 在线客服聊天窗口 */}
            {chatOpen && (
                <div className="fixed inset-0 z-[100] flex justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white flex flex-col h-full shadow-2xl animate-in slide-in-from-bottom duration-500">
                        {/* 顶部栏 */}
                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-4 flex items-center justify-between shrink-0 shadow-md">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setChatOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full active:scale-90 transition-transform">←</button>
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide">{t('member.chat_title')}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-[10px] text-white/80 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-white/40 text-xs font-mono">ID: {user?.id?.slice(-4)}</div>
                        </div>

                        {/* 消息列表 */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
                            {chatMessages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                                    <div className="text-7xl mb-6">💬</div>
                                    <p className="text-sm font-medium">{t('member.no_messages')}</p>
                                </div>
                            )}
                            {chatMessages.map((msg: any) => (
                                <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] flex flex-col ${msg.sender_type === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                            msg.sender_type === 'user'
                                                ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-br-none'
                                                : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                                        }`}>
                                            {translatedMessages[msg.id] || msg.content}
                                        </div>
                                        <div className={`flex items-center gap-3 mt-1.5 px-1`}>
                                            <span className="text-[9px] text-gray-300 font-medium">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button
                                                onClick={() => handleTranslate(msg.id, msg.content)}
                                                className={`text-[9px] font-bold transition-colors ${
                                                    translatedMessages[msg.id] ? 'text-blue-400' : 'text-pink-400 hover:text-pink-600'
                                                }`}
                                            >
                                                {translatingId === msg.id ? t('member.translating') : (translatedMessages[msg.id] ? t('member.original_text') : t('member.translate'))}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* 输入区 */}
                        <div className="bg-white border-t border-gray-100 p-4 pb-8 flex gap-3 shrink-0 items-end shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                            <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 focus-within:border-pink-300 transition-all p-1">
                                <textarea
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder={t('member.chat_placeholder')}
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-3 resize-none max-h-32 text-gray-700"
                                    rows={1}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendChat();
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleSendChat}
                                disabled={!chatInput.trim() || chatLoading}
                                className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-30 disabled:grayscale transition-all shrink-0"
                            >
                                <span className={chatLoading ? 'animate-spin' : ''}>
                                    {chatLoading ? '⏳' : '🚀'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes chatPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.5); }
                    50% { box-shadow: 0 0 0 12px rgba(236, 72, 153, 0); }
                }
            `}</style>
        </div>
    );
};

export default MemberView;
