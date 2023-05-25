/**
 * Get image url for a specific size via Image Engine
 * @param url
 * @param px_size
 * @returns
 */
export function getImageSized(url: string, px_size: number = 999) {
  if (url.indexOf(`${process.env.NEXT_PUBLIC_IM_ENG}`) === 0) return url;
  return `${process.env.NEXT_PUBLIC_IM_ENG}/w_${px_size}/${url}`;
}
