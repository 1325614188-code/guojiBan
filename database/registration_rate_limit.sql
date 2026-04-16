-- 1. 创建注册日志表，用于追踪 IP 注册频率
CREATE TABLE IF NOT EXISTS registration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 为 ip_address 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_registration_logs_ip ON registration_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_registration_logs_created_at ON registration_logs(created_at);

-- 3. 在应用配置中增加注册限制项（默认每 24h 限制 3 个）
INSERT INTO app_config (key, value) 
VALUES ('registration_limit_per_24h', '3')
ON CONFLICT (key) DO NOTHING;

-- 4. 开启 RLS
ALTER TABLE registration_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略：仅允许后台 API 插入和查询（通常通过 Service Role，这里为 anon 提供基础权限以便 API 调用）
CREATE POLICY "Allow insert for service" ON registration_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for service" ON registration_logs FOR SELECT USING (true);
