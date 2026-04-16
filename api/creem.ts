import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

        // 获取动态配置
        const { data: configs } = await supabase
            .from('app_config')
            .select('key, value')
            .in('key', ['creem_api_key', 'creem_product_id_5usd', 'creem_product_id_10usd']);
        
        const configMap: Record<string, string> = {};
        configs?.forEach(c => { configMap[c.key] = c.value; });

        const CREEM_API_KEY = configMap['creem_api_key'] || process.env.CREEM_API_KEY || 'creem_4ti9TuRNHMna3GP9hXxZO5';
        const CREEM_PRODUCT_ID_5USD = configMap['creem_product_id_5usd'] || process.env.CREEM_PRODUCT_ID_5USD || 'prod_7jbvR7bVfcXC4LZVZ7nKCp';
        const CREEM_PRODUCT_ID_10USD = configMap['creem_product_id_10usd'] || process.env.CREEM_PRODUCT_ID_10USD || 'prod_3QknshZWwWAE5HuwwnwBLi';

        switch (action) {
            case 'createCheckout': {
                const { userId, amount, credits } = data;
                let { productId } = data;

                const tradeNo = `CR${Date.now()}${Math.floor(Math.random() * 1000)}`;

                // 1. 创建订单
                const { error: orderError } = await supabase.from('orders').insert({
                    user_id: userId,
                    trade_no: tradeNo,
                    amount: amount,
                    credits: credits,
                    status: 'pending',
                    payment_method: 'creem'
                });

                if (orderError) throw orderError;

                // 2. 环境判定
                const isTestMode = CREEM_API_KEY.startsWith('creem_test_');
                const baseUrl = isTestMode ? API_BASE_URL_TEST : API_BASE_URL_PROD;

                // 3. 确定产品 ID
                if (!productId) {
                    if (amount === 5) productId = CREEM_PRODUCT_ID_5USD;
                    else if (amount === 10) productId = CREEM_PRODUCT_ID_10USD;
                }

                // 4. 调用 Creem API
                const response = await fetch(`${baseUrl}/checkouts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': CREEM_API_KEY
                    },
                    body: JSON.stringify({
                        product_id: productId,
                        success_url: `${req.headers.origin || 'https://www.sysmm.xyz'}/?payment=success&order_id=${tradeNo}`,
                        metadata: {
                            userId,
                            tradeNo,
                            credits: credits.toString()
                        }
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Creem API error: ${JSON.stringify(error)}`);
                }

                const checkoutData = await response.json();

                return res.status(200).json({
                    checkoutUrl: checkoutData.checkout_url,
                    orderId: tradeNo
                });
            }

            case 'confirmOrder': {
                const { orderId } = data;

                // 1. 获取本地订单
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('trade_no', orderId)
                    .single();

                if (orderError || !order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                // 2. 已支付检查
                if (order.status === 'completed' || order.status === 'paid') {
                    return res.status(200).json({ status: 'paid', message: 'Payment confirmed', credits: order.credits });
                }

                // 3. 实时查询
                const isTestMode = CREEM_API_KEY.startsWith('creem_test_');
                const baseUrl = isTestMode ? API_BASE_URL_TEST : API_BASE_URL_PROD;

                const response = await fetch(`${baseUrl}/checkouts/${orderId}`, {
                    method: 'GET',
                    headers: {
                        'x-api-key': CREEM_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    return res.status(200).json({ status: 'pending', message: 'Syncing status' });
                }

                const checkout = await response.json();

                if (checkout.status === 'completed') {
                    // 更新订单
                    await supabase.from('orders').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('trade_no', orderId);

                    // 增加额度
                    await supabase.rpc('add_credits', { user_id: order.user_id, amount: order.credits });

                    // 分发佣金 (使用 commission_balance)
                    const { data: user } = await supabase.from('users').select('referrer_id').eq('id', order.user_id).single();
                    if (user?.referrer_id) {
                        const commission = Number((order.amount * 0.4).toFixed(2));
                        await supabase.from('commissions').insert({
                            user_id: user.referrer_id,
                            source_user_id: order.user_id,
                            amount: commission,
                            order_id: orderId,
                            status: 'completed'
                        });
                        await supabase.rpc('add_commission', { user_id: user.referrer_id, amount: commission });
                    }

                    return res.status(200).json({ status: 'paid', message: 'Payment confirmed', credits: order.credits });
                }

                return res.status(200).json({ status: 'pending', message: 'Wait for payment' });
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
