/**
 * 轻量级设备指纹助手
 * 通过组合硬件和浏览器特征生成相对稳定的唯一标识
 */

/**
 * 简单的哈希函数 (MurmurHash-like)
 */
function cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * 获取设备特征字符串
 */
function getFingerprintData(): string {
    const gl = document.createElement('canvas').getContext('webgl') as any;
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';

    const features = [
        // 核心硬件参数 (不同浏览器/App 之间通常一致)
        screen.width + 'x' + screen.height,
        window.devicePixelRatio || 1,
        screen.colorDepth,
        navigator.hardwareConcurrency || 'unknown',
        renderer,
        new Date().getTimezoneOffset(),
    ];

    // Canvas 渲染特征
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("MeiliLab,🧬", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("MeiliLab,🧬", 4, 17);
        features.push(canvas.toDataURL());
    }

    return features.join('###');
}

/**
 * 获取稳定的设备唯一标识
 */
export async function getStableDeviceId(): Promise<string> {
    const data = getFingerprintData();
    const hash = cyrb53(data).toString(36);
    return `fp_${hash}`;
}
