const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 读取 .env.local
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

async function checkStats() {
  console.log('Connecting to Supabase:', supabaseUrl);

  // 1. 查询 admin 用户
  const { data: adminUser, error: adminErr } = await supabase
    .from('users')
    .select('id, username, nickname, is_admin')
    .eq('username', 'admin')
    .single();

  if (adminErr) {
    console.error('Error fetching admin user:', adminErr);
  } else {
    console.log('Admin User Info:', adminUser);
  }

  // 2. 查询总注册用户数
  const { count: totalUsers, error: userCountErr } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  if (userCountErr) {
    console.error('Error counting users:', userCountErr);
  } else {
    console.log('Total registered users (users table):', totalUsers);
  }

  // 3. 查询付费订单总数
  const { count: totalPaidOrders, error: orderCountErr } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'paid');

  if (orderCountErr) {
    console.error('Error counting paid orders:', orderCountErr);
  } else {
    console.log('Total paid orders (status = paid):', totalPaidOrders);
  }

  // 4. 查询推广流水数量
  const { count: totalCommissions, error: commCountErr } = await supabase
    .from('commissions')
    .select('id', { count: 'exact', head: true });

  if (commCountErr) {
    console.error('Error counting commissions:', commCountErr);
  } else {
    console.log('Total commission records (commissions table):', totalCommissions);
  }
}

checkStats();
