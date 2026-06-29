const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. 读取环境配置并初始化 Supabase
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + 'meili_salt_2026').digest('hex');
};

async function executeInjection() {
  console.log('--- Starting Promotion Flow Data Injection ---');
  console.log('Connecting to Supabase:', supabaseUrl);

  // 2. 查询默认管理员账户
  const { data: adminUser, error: adminErr } = await supabase
    .from('users')
    .select('id')
    .eq('username', 'admin')
    .single();

  if (adminErr || !adminUser) {
    console.error('Failed to locate default admin user:', adminErr || 'Not found');
    process.exit(1);
  }
  const adminId = adminUser.id;
  console.log(`Found admin user ID: ${adminId}`);

  // 3. 获取佣金率
  const { data: configData, error: configErr } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'commission_rate')
    .single();
  
  let commissionRate = 40; // 默认 40%
  if (!configErr && configData) {
    commissionRate = Number(configData.value) || 40;
  }
  console.log(`System commission rate: ${commissionRate}%`);

  // 4. 生成 100 个模拟用户
  console.log('Generating 100 fake users...');
  const usersToInsert = [];
  const now = new Date();
  const timeGap = (30 * 24 * 60 * 60 * 1000) / 100; // 30天内均匀分布

  for (let i = 1; i <= 100; i++) {
    const userTime = new Date(now.getTime() - (101 - i) * timeGap);
    const username = `promo_user_${String(i).padStart(3, '0')}`;
    const nickname = `推广测试用户 ${String(i).padStart(3, '0')}`;
    
    usersToInsert.push({
      username,
      password_hash: hashPassword('123456'),
      nickname,
      credits: 5,
      device_id: `promo_device_${String(i).padStart(3, '0')}`,
      referrer_id: adminId,
      created_at: userTime.toISOString()
    });
  }

  // 批量插入用户
  const { data: insertedUsers, error: usersInsertErr } = await supabase
    .from('users')
    .insert(usersToInsert)
    .select('id, username, created_at');

  if (usersInsertErr) {
    console.error('Error batch inserting users:', usersInsertErr);
    process.exit(1);
  }

  // 按用户名排序，确保和 i 的顺序对齐
  insertedUsers.sort((a, b) => a.username.localeCompare(b.username));
  console.log(`Successfully inserted ${insertedUsers.length} users.`);

  // 5. 生成 100 个已支付订单
  console.log('Generating 100 unique paid orders...');
  const ordersToInsert = [];
  const commissionMap = new Map(); // 用于记录每个用户的订单及其佣金金额
  const commissionAmountsSet = new Set(); // 用于确保流水金额完全唯一

  for (let i = 0; i < 100; i++) {
    const user = insertedUsers[i];
    const userTime = new Date(user.created_at);
    const orderTime = new Date(userTime.getTime() + 5 * 60 * 1000); // 注册后 5 分钟下单

    // 金额设计：20.00 + i * 3.23，这样可以保证佣金金额也呈递增，且完全不重复
    const orderAmount = Number((20.00 + i * 3.23).toFixed(2));
    const commAmount = Number((orderAmount * (commissionRate / 100)).toFixed(2));

    // 双重检查金额是否重复
    if (commissionAmountsSet.has(commAmount)) {
      console.error(`Duplicate commission amount detected: ${commAmount}. Tweaking math.`);
      process.exit(1);
    }
    commissionAmountsSet.add(commAmount);

    const credits = Math.round(orderAmount * 2);
    const tradeNo = `promo_trade_${String(i + 1).padStart(3, '0')}`;

    ordersToInsert.push({
      user_id: user.id,
      amount: orderAmount,
      credits,
      status: 'paid',
      trade_no: tradeNo,
      created_at: orderTime.toISOString(),
      paid_at: orderTime.toISOString()
    });

    commissionMap.set(user.id, {
      orderAmount,
      commAmount,
      orderTime
    });
  }

  // 批量插入订单
  const { data: insertedOrders, error: ordersInsertErr } = await supabase
    .from('orders')
    .insert(ordersToInsert)
    .select('id, user_id, trade_no');

  if (ordersInsertErr) {
    console.error('Error batch inserting orders:', ordersInsertErr);
    process.exit(1);
  }
  console.log(`Successfully inserted ${insertedOrders.length} paid orders.`);

  // 6. 生成 100 条推广流水 (commissions)
  console.log('Generating 100 commission records...');
  const commissionsToInsert = [];
  let totalCommissionsSum = 0;

  for (let i = 0; i < 100; i++) {
    const order = insertedOrders[i];
    const commInfo = commissionMap.get(order.user_id);

    commissionsToInsert.push({
      user_id: adminId,
      source_user_id: order.user_id,
      order_id: order.id,
      amount: commInfo.commAmount,
      status: 'available',
      created_at: commInfo.orderTime.toISOString()
    });

    totalCommissionsSum += commInfo.commAmount;
  }

  // 批量插入佣金记录
  const { data: insertedCommissions, error: commInsertErr } = await supabase
    .from('commissions')
    .insert(commissionsToInsert)
    .select('id, amount');

  if (commInsertErr) {
    console.error('Error batch inserting commissions:', commInsertErr);
    process.exit(1);
  }
  console.log(`Successfully inserted ${insertedCommissions.length} commission records. Total Sum: ¥${totalCommissionsSum.toFixed(2)}`);

  // 7. 更新推荐人 (admin) 的佣金余额 commission_balance (如果字段存在)
  console.log(`Attempting to update admin's commission balance by adding: ¥${totalCommissionsSum.toFixed(2)}...`);
  
  try {
    const { error: rpcErr } = await supabase.rpc('add_commission', {
      user_id: adminId,
      amount: totalCommissionsSum
    });

    if (rpcErr) {
      console.warn('[WARNING] Failed to update admin commission balance via RPC (field likely missing):', rpcErr.message);
    } else {
      console.log('Successfully updated admin balance via RPC.');
    }
  } catch (e) {
    console.warn('[WARNING] Exception caught while updating admin commission balance:', e.message);
  }

  console.log('--- Injection Completed Successfully ---');
}

executeInjection();
