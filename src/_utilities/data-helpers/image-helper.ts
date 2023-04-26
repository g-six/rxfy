/**
 * Get image url for a specific size via Image Engine
 * @param url
 * @param px_size
 * @returns
 */
export function getImageSized(url: string, px_size: number) {
  if (url.indexOf('https://e52tn40a.cdn.imgeng.in') === 0) return url;
  return `https://e52tn40a.cdn.imgeng.in/w_${px_size}/${url}`;
}
