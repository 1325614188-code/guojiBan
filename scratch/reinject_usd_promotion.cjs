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

async function executeReinjection() {
  console.log('--- Starting USD Promotion Flow Data Reinjection (RLS-Safe) ---');
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

  // 3. 获取已有的测试用户列表 (以避免 RLS 对 users 的 DELETE 限制)
  console.log('Fetching existing promo test users...');
  const { data: testUsers, error: usersFetchErr } = await supabase
    .from('users')
    .select('id, username, created_at')
    .like('username', 'promo_user_%');

  if (usersFetchErr) {
    console.error('Error fetching test users:', usersFetchErr);
    process.exit(1);
  }

  console.log(`Found ${testUsers ? testUsers.length : 0} existing test users.`);

  let finalUsers = testUsers || [];

  // 如果测试用户不够 100 个 (例如因故部分插入失败，虽说第一步已经插全了)，我们补齐它们
  if (finalUsers.length < 100) {
    console.log(`Test users count is less than 100 (only ${finalUsers.length}). Generating missing ones...`);
    const usersToInsert = [];
    const now = new Date();
    const timeGap = (30 * 24 * 60 * 60 * 1000) / 100;
    
    // 找出缺失的 username 序号并生成
    const existingUsernames = new Set(finalUsers.map(u => u.username));
    
    const hashPassword = (password) => {
      return crypto.createHash('sha256').update(password + 'meili_salt_2026').digest('hex');
    };

    for (let i = 1; i <= 100; i++) {
      const username = `promo_user_${String(i).padStart(3, '0')}`;
      if (!existingUsernames.has(username)) {
        const userTime = new Date(now.getTime() - (101 - i) * timeGap);
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
    }

    if (usersToInsert.length > 0) {
      const { data: newlyInsertedUsers, error: usersInsertErr } = await supabase
        .from('users')
        .insert(usersToInsert)
        .select('id, username, created_at');

      if (usersInsertErr) {
        console.error('Error inserting missing users:', usersInsertErr);
        process.exit(1);
      }
      finalUsers = finalUsers.concat(newlyInsertedUsers);
      console.log(`Successfully added ${newlyInsertedUsers.length} missing users.`);
    }
  }

  const testUserIds = finalUsers.map(u => u.id);

  // 4. 清理现有的相关 orders 和 commissions 数据 (这两个表 RLS 策略或默认配置允许 delete)
  console.log('Cleaning existing USD/CNY commissions and orders linked to these users...');
  
  // A. 删除旧佣金明细
  const { error: commDelErr } = await supabase
    .from('commissions')
    .delete()
    .in('source_user_id', testUserIds);

  if (commDelErr) {
    console.error('Error deleting commissions:', commDelErr);
    process.exit(1);
  }
  console.log('Successfully deleted related commissions.');

  // B. 删除旧订单
  const { error: orderDelErr } = await supabase
    .from('orders')
    .delete()
    .in('user_id', testUserIds);

  if (orderDelErr) {
    console.error('Error deleting orders:', orderDelErr);
    process.exit(1);
  }
  console.log('Successfully deleted related orders.');

  // 5. 按 username 排序，以使订单金额分配有序
  finalUsers.sort((a, b) => a.username.localeCompare(b.username));

  // 6. 获取系统当前佣金率
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

  // 7. 生成 100 个已支付订单 (USD计价，符合 5 或 10 美元套餐的倍数)
  console.log('Generating 100 unique USD paid orders...');
  const ordersToInsert = [];
  const commissionMap = new Map();

  for (let i = 0; i < 100; i++) {
    const user = finalUsers[i];
    const userTime = new Date(user.created_at);
    const orderTime = new Date(userTime.getTime() + 5 * 60 * 1000); // 注册后 5 分钟购买

    // 金额设计：(5.00 + (i % 10) * 5.00) 美元
    // 订单金额包括：$5, $10, $15, $20, $25, $30, $35, $40, $45, $50
    // 分配得非常均匀，代表充值了不同的倍数套餐，佣金也分别对应为：
    // $2, $4, $6, $8, $10, $12, $14, $16, $18, $20
    const orderAmount = Number((5.00 + (i % 10) * 5.00).toFixed(2));
    const commAmount = Number((orderAmount * (commissionRate / 100)).toFixed(2));

    // 根据金额分配 credits，5美金是12，10美金是30
    let credits = 0;
    const tens = Math.floor(orderAmount / 10);
    const remainder = orderAmount % 10;
    credits += tens * 30;
    if (remainder >= 5) {
      credits += 12;
    }

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

  // 8. 生成 100 条推广流水 (commissions)
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
  console.log(`Successfully inserted ${insertedCommissions.length} commission records. Total Sum: $${totalCommissionsSum.toFixed(2)}`);
  console.log('--- USD Reinjection Completed Successfully (RLS-Safe) ---');
}

executeReinjection();
