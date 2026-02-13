import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 从环境变量获取 Stripe 密钥
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * 初始化 Stripe 实例
 * NOTE: 在 Vercel serverless 环境中每次请求可能重新创建实例
 */
function getStripe(): Stripe {
    if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    return new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia' as any,
    });
}

/**
 * 充值套餐定义
 * NOTE: 价格单位为美分（cents），Stripe 要求整数金额
 */
const RECHARGE_PLANS: Record<string, { amount: number; credits: number; name: string }> = {
    'plan_test': { amount: 50, credits: 1, name: 'Beauty Lab - Test (1 Credit)' },
    'plan_12': { amount: 199, credits: 12, name: 'Beauty Lab - 12 Credits' },
    'plan_30': { amount: 399, credits: 30, name: 'Beauty Lab - 30 Credits' },
};

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { action, ...data } = req.body;

        switch (action) {
            // 创建 Stripe Checkout Session
            case 'createCheckoutSession': {
                const { userId, amount, credits } = data;
                const stripe = getStripe();

                // 根据金额匹配套餐
                const planKey = credits === 1 ? 'plan_test' : credits === 12 ? 'plan_12' : 'plan_30';
                const plan = RECHARGE_PLANS[planKey];

                if (!plan) {
                    return res.status(400).json({ error: 'Invalid plan' });
                }

                // 生成订单号
                const orderId = `ML${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

                // 创建订单记录
                await supabase.from('orders').insert({
                    user_id: userId,
                    amount: plan.amount / 100, // 存储实际美元金额
                    credits: plan.credits,
                    status: 'pending',
                    trade_no: orderId
                });

                // 创建 Stripe Checkout Session
                const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://your-domain.com';

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: plan.name,
                                    description: `Recharge ${plan.credits} credits for Beauty Lab`,
                                },
                                unit_amount: plan.amount, // Stripe 使用最小货币单位（美分）
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${origin}?payment=success&order_id=${orderId}`,
                    cancel_url: `${origin}?payment=cancel&order_id=${orderId}`,
                    metadata: {
                        orderId,
                        userId,
                        credits: plan.credits.toString(),
                    },
                });

                return res.status(200).json({
                    success: true,
                    orderId,
                    payUrl: session.url,
                    sessionId: session.id,
                });
            }

            // Stripe Webhook 处理支付结果通知
            case 'webhook': {
                const sig = req.headers['stripe-signature'];

                // 如果有签名和 webhook secret，验证签名
                if (sig && webhookSecret) {
                    try {
                        const stripe = getStripe();
                        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
                        const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

                        if (event.type === 'checkout.session.completed') {
                            const session = event.data.object as Stripe.Checkout.Session;
                            const orderId = session.metadata?.orderId;
                            const credits = parseInt(session.metadata?.credits || '0', 10);

                            if (orderId) {
                                // 查询订单
                                const { data: order } = await supabase
                                    .from('orders')
                                    .select('user_id, credits, status')
                                    .eq('trade_no', orderId)
                                    .single();

                                if (order && order.status === 'pending') {
                                    // 更新订单为已支付
                                    await supabase
                                        .from('orders')
                                        .update({ status: 'paid', paid_at: new Date().toISOString() })
                                        .eq('trade_no', orderId);

                                    // 增加用户额度
                                    await supabase.rpc('add_credits', { user_id: order.user_id, amount: order.credits });
                                }
                            }
                        }
                    } catch (err: any) {
                        console.error('[Stripe Webhook] Signature verification failed:', err.message);
                        return res.status(400).json({ error: 'Webhook signature verification failed' });
                    }
                }

                return res.status(200).json({ received: true });
            }

            // 查询订单状态
            case 'checkOrder': {
                const { orderId } = data;

                const { data: order } = await supabase
                    .from('orders')
                    .select('status, credits')
                    .eq('trade_no', orderId)
                    .single();

                return res.status(200).json({
                    success: true,
                    status: order?.status || 'unknown',
                    credits: order?.credits || 0
                });
            }

            // 用户主动确认订单（Webhook 失效时的备选方案）
            case 'confirmOrder': {
                const { orderId, userId } = data;

                const { data: order } = await supabase
                    .from('orders')
                    .select('user_id, credits, status')
                    .eq('trade_no', orderId)
                    .single();

                if (!order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                if (order.status === 'paid') {
                    return res.status(200).json({ success: true, message: 'Order already processed', credits: order.credits });
                }

                // 更新订单为已支付
                await supabase
                    .from('orders')
                    .update({ status: 'paid', paid_at: new Date().toISOString() })
                    .eq('trade_no', orderId);

                // 增加用户额度
                await supabase.rpc('add_credits', { user_id: order.user_id, amount: order.credits });

                return res.status(200).json({
                    success: true,
                    message: 'Recharge successful',
                    credits: order.credits
                });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('[Stripe Error]', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
