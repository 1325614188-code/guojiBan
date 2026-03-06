/**
 * 全局配置文件
 * 处理跨平台（Web / Android Capacitor）的 API 路径兼容性
 */

// 环境判断：是否在 Capacitor 原生环境下运行
// 环境判断：只要不是正式在线域名，且处于 file 协议或类似环境，均视为原生/开发环境
export const isNative =
    (window as any).Capacitor?.isNative ||
    window.location.protocol === 'file:' ||
    !window.location.hostname.includes('sysmm.xyz');

// 原生环境下 API 需使用生产环境绝对路径，Web 环境下使用相对路径（开发模式代理或生产环境同源）
export const API_BASE = 'https://www.sysmm.xyz';

console.log(`[Config] Platform: ${isNative ? 'Native' : 'Web'}, API_BASE: ${API_BASE}`);
