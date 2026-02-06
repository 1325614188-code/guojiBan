-- Supabase 函数：增减用户额度和积分
-- 注意：参数名必须与 API 调用时传入的名称一致

-- ==========================================
-- 1. 用户额度相关
-- ==========================================

-- 删除旧函数（如果存在）
DROP FUNCTION IF EXISTS add_credits(UUID, INT);

-- 创建增减额度函数
CREATE OR REPLACE FUNCTION add_credits(user_id UUID, amount INT)
RETURNS void AS $$
BEGIN
  UPDATE users SET credits = credits + amount WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. 推荐奖励积分相关
-- ==========================================

-- 用户表新增积分字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;

-- 积分兑换申请表
CREATE TABLE IF NOT EXISTS point_redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    username TEXT,
    points_used INT NOT NULL,
    reward_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending/approved/rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    admin_note TEXT
);

-- 删除旧积分函数（如果存在）
DROP FUNCTION IF EXISTS add_points(UUID, INT);

-- 创建增减积分函数
CREATE OR REPLACE FUNCTION add_points(user_id UUID, amount INT)
RETURNS void AS $$
BEGIN
  UPDATE users SET points = points + amount WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
