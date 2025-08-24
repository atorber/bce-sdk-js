/**
 * @file src/mime.types.ts
 * @author leeight
 */

// MIME 类型映射表
const mimeTypes: Record<string, string> = {
  // 文档类型
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'txt': 'text/plain',
  'rtf': 'application/rtf',
  
  // 图片类型
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  
  // 音频类型
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'aac': 'audio/aac',
  'flac': 'audio/flac',
  'm4a': 'audio/m4a',
  'wma': 'audio/x-ms-wma',
  
  // 视频类型
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
  'flv': 'video/x-flv',
  'webm': 'video/webm',
  'mkv': 'video/x-matroska',
  '3gp': 'video/3gpp',
  
  // Web 文件
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'js': 'application/javascript',
  'mjs': 'application/javascript',
  'json': 'application/json',
  'xml': 'application/xml',
  'xhtml': 'application/xhtml+xml',
  
  // 压缩文件
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
  'bz2': 'application/x-bzip2',
  
  // 字体文件
  'ttf': 'font/ttf',
  'otf': 'font/otf',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'eot': 'application/vnd.ms-fontobject',
  
  // 其他常用类型
  'bin': 'application/octet-stream',
  'exe': 'application/octet-stream',
  'dmg': 'application/octet-stream',
  'iso': 'application/octet-stream',
  'deb': 'application/octet-stream',
  'rpm': 'application/octet-stream',
  'apk': 'application/vnd.android.package-archive',
  'ipa': 'application/octet-stream'
};

/**
 * MIME 类型工具类
 */
class MimeType {
  /**
   * 根据文件扩展名猜测 MIME 类型
   * @param extension 文件扩展名（带或不带点）
   * @returns MIME 类型字符串
   */
  static guess(extension: string): string {
    if (!extension) {
      return 'application/octet-stream';
    }
    
    // 移除开头的点号并转为小写
    const ext = extension.toLowerCase().replace(/^\./, '');
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  /**
   * 根据文件名猜测 MIME 类型
   * @param filename 文件名
   * @returns MIME 类型字符串
   */
  static guessFromFilename(filename: string): string {
    if (!filename) {
      return 'application/octet-stream';
    }
    
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return 'application/octet-stream';
    }
    
    const extension = filename.substring(lastDotIndex + 1);
    return this.guess(extension);
  }
  
  /**
   * 检查是否为图片类型
   * @param mimeType MIME 类型字符串
   * @returns 是否为图片类型
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }
  
  /**
   * 检查是否为视频类型
   * @param mimeType MIME 类型字符串
   * @returns 是否为视频类型
   */
  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }
  
  /**
   * 检查是否为音频类型
   * @param mimeType MIME 类型字符串
   * @returns 是否为音频类型
   */
  static isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }
  
  /**
   * 检查是否为文本类型
   * @param mimeType MIME 类型字符串
   * @returns 是否为文本类型
   */
  static isText(mimeType: string): boolean {
    return mimeType.startsWith('text/') || 
           mimeType === 'application/json' ||
           mimeType === 'application/xml' ||
           mimeType === 'application/javascript';
  }
  
  /**
   * 获取所有支持的扩展名
   * @returns 扩展名数组
   */
  static getSupportedExtensions(): string[] {
    return Object.keys(mimeTypes);
  }
  
  /**
   * 添加自定义 MIME 类型映射
   * @param extension 文件扩展名
   * @param mimeType MIME 类型
   */
  static addType(extension: string, mimeType: string): void {
    const ext = extension.toLowerCase().replace(/^\./, '');
    mimeTypes[ext] = mimeType;
  }
}

export default MimeType;