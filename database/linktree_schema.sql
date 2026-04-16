-- Linktree 导航功能数据库结构
-- 请在 Supabase SQL 编辑器中执行此脚本

-- 1. 导航链接表
CREATE TABLE IF NOT EXISTS linktree_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 访问日志表
CREATE TABLE IF NOT EXISTS linktree_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES linktree_links(id) ON DELETE CASCADE,
    ip_address TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 启用 Row Level Security (RLS)
ALTER TABLE linktree_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE linktree_visits ENABLE ROW LEVEL SECURITY;

-- 4. 创建策略：允许匿名访问（读取链接与记录日志）
-- 注意：在生产环境中，通常建议通过 Edge Functions 或 Vercel Serverless 层访问数据库，而不是直接从客户端暴露所有权限。
-- 这里的策略是为了配合 api/linktree.ts 中的 supabase-js 客户端（如果使用的是 anon key）。
CREATE POLICY "Allow public select for linktree_links" ON linktree_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert for linktree_visits" ON linktree_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all for admin" ON linktree_links FOR ALL USING (true);
CREATE POLICY "Allow all for admin" ON linktree_visits FOR ALL USING (true);

-- 5. 提示
-- 如果您使用的是服务角色密钥 (Service Role Key)，则无需配置上述 RLS 策略。
-- 此脚本集成了级联删除，删除链接时会自动删除其对应的统计数据。
