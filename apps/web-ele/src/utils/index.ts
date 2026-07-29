import { getDictByCode } from '#/api';

export const getDict = async (code: string) => {
  try {
    const res = await getDictByCode(code);
    if (res.code === 200) {
      const itemList = JSON.parse(res.data.dictJson);
      return itemList.length > 0
        ? itemList.map((item: any) => ({
            label: item.value,
            value: item.key,
          }))
        : [];
    }
    return [];
  } catch (error) {
    console.error('获取字典失败:', error);
    return [];
  }
};

/** 文件/图片访问前缀（.env 中 VITE_MINIO_URL，如 https://file.gzstarfly.com） */
export const FILE_BASE_URL = String(
  import.meta.env.VITE_MINIO_URL || '',
).replace(/\/$/, '');

/**
 * 相对路径转可访问完整地址（回显用）
 * 已是 http(s) 则原样返回
 */
export function resolveFileUrl(path?: null | string) {
  if (!path) return '';
  const raw = String(path).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.replace(/^\//, '');
  return FILE_BASE_URL ? `${FILE_BASE_URL}/${normalized}` : `/${normalized}`;
}

/**
 * 从完整地址或上传文件对象中取出相对路径（提交接口用）
 */
export function toRelativeFilePath(input: any) {
  if (!input) return '';
  if (typeof input === 'object') {
    if (input.path) return String(input.path).replace(/^\//, '');
    input = input.url || '';
  }
  const raw = String(input).trim();
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) return raw.replace(/^\//, '');
  // 优先去掉配置的访问前缀
  if (FILE_BASE_URL && raw.startsWith(FILE_BASE_URL)) {
    return raw.slice(FILE_BASE_URL.length).replace(/^\//, '');
  }
  // 兜底：去掉任意域名，只保留 path
  return raw.replace(/^https?:\/\/[^/]+\/?/, '');
}
