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

async function inspectAndClearCache() {
  console.log('Connecting to Supabase:', supabaseUrl);
  
  // 1. 查询缓存表中最新的 5 条记录
  const { data: list, error: err } = await supabase
    .from('gemini_cache')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (err) {
    console.error('Error fetching cache list:', err);
    return;
  }
  
  console.log(`Found ${list.length} recent cache records:`);
  list.forEach((item, idx) => {
    console.log(`\n--- Record #${idx + 1} ---`);
    console.log(`Input Hash: ${item.input_hash}`);
    console.log(`Created At: ${item.created_at}`);
    try {
      const parsed = JSON.parse(item.result);
      console.log('Result Keys:', Object.keys(parsed));
      console.log('Result Authenticity:', parsed.authenticity);
      console.log('Result Quality:', parsed.quality);
      if (item.result.length > 500) {
        console.log('Result (truncated):', item.result.substring(0, 300) + '...');
      } else {
        console.log('Result:', item.result);
      }
    } catch(e) {
      console.log('Result (non-JSON):', item.result);
    }
  });

  // 2. 清除缓存以防中毒缓存干扰测试
  console.log('\nPurging gemini_cache table to clear any poisoned cache...');
  const { error: delErr } = await supabase
    .from('gemini_cache')
    .delete()
    .neq('input_hash', 'keep_safe_non_existent_hash'); // 删除所有记录
    
  if (delErr) {
    console.error('Error purging cache:', delErr);
  } else {
    console.log('Successfully purged all cache records! The cache is now 100% clean.');
  }
}

inspectAndClearCache();
