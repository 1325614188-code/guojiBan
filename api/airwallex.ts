import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID || '';
const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY || '';
const API_BASE_URL = 'https://api.airwallex.com/api/v1'; // 生产环境。如果是测试环境请改为 https://api-demo.airwallex.com/api/v1

/**
 * 获取 Airwallex Access Token
 */
async function getAccessToken() {
    const response = await fetch(`${API_BASE_URL}/authentication/login`, {
        method: 'POST',
        headers: {
            'x-client-id': AIRWALLEX_CLIENT_ID,
            'x-api-key': AIRWALLEX_API_KEY,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Airwallex auth failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.token;
}

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { action, ...data } = body;

        switch (action) {
            case 'createPaymentIntent': {
                const { userId, amount, credits, currency = 'USD' } = data;
                const token = await getAccessToken();

                const tradeNo = `AW${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

                // 1. 在数据库创建订单
                const { error: orderError } = await supabase.from('orders').insert({
                    user_id: userId,
                    amount: amount,
                    credits: credits,
                    status: 'pending',
                    trade_no: tradeNo,
                    payment_method: 'airwallex'
                });

                if (orderError) throw orderError;

                // 2. 调用 Airwallex 创建 Payment Intent
                const intentResponse = await fetch(`${API_BASE_URL}/pa/payment_intents/create`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        request_id: tradeNo,
                        amount: amount,
                        currency: currency,
                        merchant_order_id: tradeNo,
                        metadata: {
                            userId,
                            credits: credits.toString()
                        },
                        return_url: `${req.headers.origin}/?payment=success&order_id=${tradeNo}`,
                    }),
                });

                if (!intentResponse.ok) {
                    const error = await intentResponse.json();
                    throw new Error(`Airwallex payment intent failed: ${JSON.stringify(error)}`);
                }

                const intentData = await intentResponse.json();

                return res.status(200).json({
                    paymentIntentId: intentData.id,
                    clientSecret: intentData.client_secret,
                    orderId: tradeNo
                });
            }

            case 'confirmOrder': {
                const { orderId } = data;

                // 校验订单状态
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('trade_no', orderId)
                    .single();

                if (orderError || !order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                if (order.status === 'completed') {
                    return res.status(200).json({ success: true, message: 'Already completed' });
                }

                // 这里建议配合 Webhook 使用。如果是同步查询：
                const token = await getAccessToken();
                // 注意：这里需要根据实际支付意向 ID 查询，此处简化为交易号查询逻辑或由前端传回 ID
                // 暂时仅做本地逻辑更新标识

                return res.status(200).json({
                    success: false,
                    message: 'Payment verification pending. Please wait for webhook or manual check.'
                });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('Airwallex handler error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
