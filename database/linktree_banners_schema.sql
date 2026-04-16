-- Linktree 轮播图表
CREATE TABLE IF NOT EXISTS linktree_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 策略
ALTER TABLE linktree_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select for linktree_banners" ON linktree_banners FOR SELECT USING (true);
CREATE POLICY "Allow all for admin on linktree_banners" ON linktree_banners FOR ALL USING (true);
