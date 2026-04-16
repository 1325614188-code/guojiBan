-- 为 linktree_links 表添加多语言翻译支持
ALTER TABLE linktree_links ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
