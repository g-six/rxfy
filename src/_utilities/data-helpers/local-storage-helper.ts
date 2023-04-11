/**
 * Set localStorage data if possible
 * @param key
 * @param data
 * @returns
 */
export function setData(key: string, data?: string) {
  let res = null;
  try {
    const isBrowser: boolean = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    if (isBrowser && data) {
      res = localStorage.setItem(key, data);
      res = res === undefined;
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.log('Error: setData from local storage failed', e);
  }
  return res;
}

/**
 * Get localStorage data if available
 * @param key
 * @param default value if key does not exist
 * @returns
 */
export function getData(key: string, defaultVal = null) {
  let res = defaultVal;
  try {
    const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    const data = isBrowser ? localStorage.getItem(key) : res;
    res = data && data.length && data !== 'undefined' ? JSON.parse(data) : defaultVal;
  } catch (e) {
    console.log('Error: getData from local storage failed', e);
  }
  return res;
}
