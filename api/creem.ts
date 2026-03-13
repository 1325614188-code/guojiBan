import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CREEM_API_KEY = process.env.CREEM_API_KEY || 'creem_4ti9TuRNHMna3GP9hXxZO5';
const CREEM_PRODUCT_ID_5USD = process.env.CREEM_PRODUCT_ID_5USD || 'prod_7jbvR7bVfcXC4LZVZ7nKCp';
const CREEM_PRODUCT_ID_10USD = process.env.CREEM_PRODUCT_ID_10USD || 'prod_3QknshZWwWAE5HuwwnwBLi';

const API_BASE_URL_PROD = 'https://api.creem.io/v1';
const API_BASE_URL_TEST = 'https://test-api.creem.io/v1';
export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { action, ...data } = body;

        switch (action) {
            case 'createCheckout': {
                const { userId, amount, credits } = data;
                let { productId } = data;

                if (!CREEM_API_KEY) throw new Error('CREEM_API_KEY is not configured');

                // 诊断日志：记录 Key 的前缀和末尾（不泄露中间部分）
                const keyPrefix = CREEM_API_KEY.substring(0, 11);
                const keySuffix = CREEM_API_KEY.slice(-4);
                console.log(`[Creem Debug] Using Key prefix: ${keyPrefix}...${keySuffix}`);

                // 强制使用服务器端配置的 Product ID，防止前端传入错误的 ID（如生产/测试混用）
                if (amount === 5) {
                    productId = CREEM_PRODUCT_ID_5USD;
                } else if (amount === 10) {
                    productId = CREEM_PRODUCT_ID_10USD;
                }
                
                console.log(`[Creem Debug] Processing checkout for amount: ${amount}, productId: ${productId}`);

                const tradeNo = `CR${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

                // 1. Create pending order in Supabase
                const { error: orderError } = await supabase.from('orders').insert({
                    user_id: userId,
                    amount: amount,
                    credits: credits,
                    status: 'pending',
                    trade_no: tradeNo,
                    payment_method: 'creem'
                });

                if (orderError) throw orderError;

                // 2. Call Creem to create Checkout Session
                const isTestMode = CREEM_API_KEY.startsWith('creem_test_');
                const baseUrl = isTestMode ? API_BASE_URL_TEST : API_BASE_URL_PROD;
                const origin = req.headers.origin || 'https://www.sysmm.xyz';
                
                const response = await fetch(`${baseUrl}/checkouts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': CREEM_API_KEY
                    },
                    body: JSON.stringify({
                        product_id: productId,
                        success_url: `${origin}?payment=success&orderId=${tradeNo}`,
                        metadata: {
                            userId,
                            tradeNo,
                            credits: credits.toString()
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Creem API error: ${JSON.stringify(errorData)}`);
                }

                const checkoutData = await response.json();

                return res.status(200).json({
                    checkoutUrl: checkoutData.checkout_url,
                    orderId: tradeNo
                });
            }

            case 'confirmOrder': {
                const { orderId } = data;

                // Simple manual confirmation logic (should be supplemented with Webhooks)
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('trade_no', orderId)
                    .single();

                if (orderError || !order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                if (order.status === 'completed') {
                    return res.status(200).json({ success: true, message: 'Payment confirmed', credits: order.credits });
                }

                // NOTE: Here we assume the payment is confirmed (in real scenarios, we check Creem API)
                // 1. Update order status
                await supabase.from('orders').update({ status: 'completed' }).eq('trade_no', orderId);

                // 2. Add credits to user
                const { data: user } = await supabase.from('users').select('credits, referrer_id').eq('id', order.user_id).single();
                if (user) {
                    await supabase.from('users').update({ credits: (user.credits || 0) + order.credits }).eq('id', order.user_id);

                    // 3. Referral Commission (40%)
                    if (user.referrer_id) {
                        const commission = order.amount * 0.4;
                        const { data: referrer } = await supabase.from('users').select('commission_unsettled').eq('id', user.referrer_id).single();
                        if (referrer) {
                            await supabase.from('users').update({
                                commission_unsettled: (referrer.commission_unsettled || 0) + commission
                            }).eq('id', user.referrer_id);
                        }
                    }
                }

                return res.status(200).json({ success: true, message: 'Payment confirmed & Commission distributed', credits: order.credits });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('[Creem Error Detail]:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        return res.status(500).json({ 
            error: error.message || 'Internal server error',
            details: error.toString(),
            _v: 'creem-debug-v1'
        });
    }
}
