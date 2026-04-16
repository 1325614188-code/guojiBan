/**
 * 图片处理工具类
 */

/**
 * 将 Base64 或 File 对象压缩至指定尺寸和质量
 * @param source Base64 字符串或 File 对象
 * @param maxWidth 最大宽度 (像素)，默认 1024
 * @param quality 压缩质量 (0.1 - 1.0)，默认 0.8
 * @returns 压缩后的 Base64 字符串
 */
export async function compressImage(
  source: string | File,
  maxWidth: number = 1024,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // 如果图片宽度超过最大值，进行缩放
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }

      // 绘制图片到 Canvas
      ctx.drawImage(img, 0, 0, width, height);

      // 导出为压缩后的 Base64
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = (err) => {
      reject(new Error('图片加载失败: ' + err));
    };

    // 设置图片源
    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => {
        reject(new Error('文件读取失败: ' + err));
      };
      reader.readAsDataURL(source);
    }
  });
}

/**
 * 辅助函数：将 Base64 转换为 Blob (如果需要上传文件流)
 */
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}
