/**
 * 将 Base URL 和 Relative URL 合并成一个新的 URL
 *
 * @param baseURL 基础 URL（例如：https://www.bilibili.com/）
 * @param relativeURL 相对 URL（例如：/video/av1）
 * @returns 合并后的 URL（例如：https://www.bilibili.com/video/av1）
 */
export const combineURLs = (baseURL: string, relativeURL: string): string => {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};