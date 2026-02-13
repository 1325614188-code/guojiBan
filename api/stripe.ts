import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 从环境变量获取 Stripe 密钥
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

function getStripe(): Stripe {
    if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    return new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16' as any,
    });
}

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { action, ...data } = JSON.parse(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

        switch (action) {
            case 'createCheckoutSession': {
                const { userId, amount, credits } = data;
                const stripe = getStripe();

                const tradeNo = `ML${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

                const { error: orderError } = await supabase.from('orders').insert({
                    user_id: userId,
                    amount: amount,
                    credits: credits,
                    status: 'pending',
                    trade_no: tradeNo
                });

                if (orderError) throw orderError;

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: `${credits} Credits for Beauty Lab`,
                                },
                                unit_amount: Math.round(amount * 100),
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${req.headers.origin}/?payment=success&order_id=${tradeNo}`,
                    cancel_url: `${req.headers.origin}/?payment=cancel`,
                    client_reference_id: userId,
                    metadata: {
                        tradeNo,
                        userId,
                        credits: credits.toString()
                    }
                });

                return res.status(200).json({
                    payUrl: session.url,
                    orderId: tradeNo,
                    _db: supabaseUrl.split('//')[1]?.split('.')[0] || 'missing'
                });
            }

            case 'confirmOrder': {
                const { orderId, userId: providedUserId } = data;

                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('trade_no', orderId)
                    .single();

                if (orderError || !order) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                if (order.status === 'completed') {
                    return res.status(200).json({
                        message: 'Order already confirmed',
                        credits: 0,
                        _db: supabaseUrl.split('//')[1]?.split('.')[0] || 'missing'
                    });
                }

                const targetUserId = providedUserId !== 'anonymous' ? providedUserId : order.user_id;

                const { data: user, error: userErr } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', targetUserId)
                    .single();

                if (userErr || !user) {
                    return res.status(404).json({ error: 'User not found for this order' });
                }

                const newCredits = (user.credits || 0) + order.credits;
                const { error: updateErr } = await supabase
                    .from('users')
                    .update({ credits: newCredits })
                    .eq('id', targetUserId);

                if (updateErr) throw updateErr;

                await supabase.from('orders').update({
                    status: 'completed',
                    paid_at: new Date().toISOString()
                }).eq('trade_no', orderId);

                return res.status(200).json({
                    success: true,
                    message: 'Payment confirmed successfully',
                    credits: order.credits,
                    userId: targetUserId,
                    _db: supabaseUrl.split('//')[1]?.split('.')[0] || 'missing'
                });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('Stripe handler error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
