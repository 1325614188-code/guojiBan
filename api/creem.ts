import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CREEM_API_KEY = process.env.CREEM_API_KEY || 'creem_test_3BamgzNSWsnBXdek3GbvS1';
const CREEM_PRODUCT_ID_5USD = process.env.CREEM_PRODUCT_ID_5USD || 'prod_3ZLKsrhpAv5ZgYcSEuNsLF';
const CREEM_PRODUCT_ID_10USD = process.env.CREEM_PRODUCT_ID_10USD || 'prod_44pSRpkGZJlBVsIJ7rqkXJ';

const API_BASE_URL = 'https://api.creem.io/v1';

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
                const { userId, productId, amount, credits } = data;

                if (!CREEM_API_KEY) throw new Error('CREEM_API_KEY is not configured');

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
                const response = await fetch(`${API_BASE_URL}/checkouts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': CREEM_API_KEY
                    },
                    body: JSON.stringify({
                        product_id: productId,
                        return_url: `${req.headers.origin}/?payment=success&order_id=${tradeNo}`,
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

                // In a real scenario, you'd check Creem's API for the status of this order
                // For now, we return a message indicating we're waiting for completion
                return res.status(200).json({
                    success: false,
                    message: 'Waiting for payment confirmation. If you have paid, please refresh in a moment.'
                });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('Creem handler error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
