import React, { useState, useEffect } from 'react';
import { getStableDeviceId } from '../lib/fingerprint';
import { getApiUrl } from '../lib/api-config';
import { useTranslation } from 'react-i18next';

interface LoginViewProps {
    onLogin: (user: any) => void;
    onBack: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBack }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const [error, setError] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [inviteCode, setInviteCode] = useState('');



    // 获取设备ID
    const getDeviceId = async (): Promise<string> => {
        try {
            let deviceId = localStorage.getItem('device_id');
            if (!deviceId || deviceId.startsWith('dev_')) {
                deviceId = await getStableDeviceId();
                localStorage.setItem('device_id', deviceId);
            }
            return deviceId || 'UNKNOWN';
        } catch (e) {
            console.error('Failed to get device ID:', e);
            return 'ERROR_ID';
        }
    };


    // 加载验证码
    const loadCaptcha = async () => {
        try {
            const ts = Date.now();
            const response = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getCaptcha' })
            });
            const data = await response.json();
            if (data.svg && data.captchaToken) {
                setCaptchaSvg(data.svg);
                setCaptchaToken(data.captchaToken);
                setCaptchaInput('');
            }
        } catch (e) {
            console.error('Failed to load captcha:', e);
        }
    };

    // 切换到注册时自动加载验证码
    useEffect(() => {
        if (isRegister) {
            loadCaptcha();
        }
    }, [isRegister]);





    // 处理微信回调 code (已移至 App.tsx 全局处理)
    // useEffect(() => { ... }, []);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError(t('common.auth_error'));
            return;
        }
        setError('');
        setLoading(true);

        try {
            const deviceId = await getDeviceId();
            const ts = Date.now();
            const response = await fetch(getApiUrl(`/api/auth_v2?t=${ts}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isRegister ? 'register' : 'login',
                    username: username.trim(),
                    password,
                    nickname: username,
                    deviceId,
                    inviteCode: isRegister ? inviteCode : undefined,
                    captcha: captchaInput.trim(),
                    captchaToken
                })

            });


            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('common.error'));
            }

            // 保存用户信息
            localStorage.setItem('user', JSON.stringify(data.user));
            onLogin(data.user);
        } catch (err: any) {
            setError(err.message || t('common.error'));
            // 登录/注册失败后刷新验证码
            if (isRegister) loadCaptcha();
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-6 pb-24">
            <div className="w-full max-w-md animate-in fade-in duration-500">
                <button
                    onClick={onBack}
                    className="text-2xl mb-4 p-2 active:bg-white/20 rounded-full transition-colors"
                    aria-label={t('common.back_to_center')}
                >
                    ←
                </button>

                <div className="bg-white rounded-3xl p-8 shadow-2xl border border-pink-100">
                    <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        {isRegister ? t('common.register_title') : t('common.login_title')}
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-sm flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400 ml-1">{t('common.username').toUpperCase()}</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-transparent focus:border-pink-300 focus:bg-white focus:outline-none transition-all"
                                placeholder={t('common.username')}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400 ml-1">{t('common.password').toUpperCase()}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-transparent focus:border-pink-300 focus:bg-white focus:outline-none transition-all"
                                placeholder={t('common.password')}
                                required
                            />
                        </div>

                        {isRegister && (
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-400 ml-1">{t('common.captcha').toUpperCase()}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={captchaInput}
                                        onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
                                        className="flex-1 h-12 px-4 rounded-2xl bg-gray-50 border border-transparent focus:border-pink-300 focus:bg-white focus:outline-none transition-all placeholder:text-gray-300"
                                        placeholder={t('common.captcha_placeholder')}
                                        required={isRegister}
                                    />
                                    <div 
                                        className="h-12 w-32 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center bg-pink-50 rounded-2xl overflow-hidden border border-pink-100"
                                        onClick={loadCaptcha}
                                        dangerouslySetInnerHTML={{ __html: captchaSvg }}
                                        title={t('common.refresh_captcha')}
                                    ></div>

                                </div>
                            </div>
                        )}

                        {isRegister && (
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-400 ml-1">
                                    {t('common.invite_code').toUpperCase()} 
                                    <span className="text-gray-400 font-normal ml-1">({t('common.optional') || 'Optional'})</span>
                                    <span className="text-pink-400 ml-1">{t('member.invite_reward_tip')}</span>
                                </label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-transparent focus:border-pink-300 focus:bg-white focus:outline-none transition-all placeholder:text-gray-200"
                                    placeholder={t('member.bind_invite_placeholder')}
                                    maxLength={6}
                                />
                            </div>
                        )}


                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 xhs-gradient text-white rounded-2xl font-bold disabled:opacity-50 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('common.loading')}</>
                            ) : (isRegister ? t('common.register_btn') : t('common.login_btn'))}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-pink-500 text-sm font-medium hover:underline"
                        >
                            {isRegister ? t('common.go_login') : t('common.go_register')}
                        </button>
                    </div>


                    {isRegister && (
                        <div className="mt-6 p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100">
                            <p className="text-[10px] text-pink-600 leading-relaxed text-center">
                                🎁 <span className="font-bold text-sm">{t('common.new_user_benefit')}</span><br/>
                                {t('common.register_gift_desc', { count: 3 })}<br/>
                                <span className="text-purple-600 font-bold">填正式邀请码，再领 5 次！累计 8 次！</span>
                            </p>
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-gray-300 text-xs">
                    {t('common.copyright', { appName: t('common.app_name') })}
                </p>
            </div>
        </div>
    );
};

export default LoginView;
