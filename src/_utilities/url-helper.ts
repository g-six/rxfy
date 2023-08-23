export function queryStringToObject(queryString: string): Record<string, string | number> {
  const queryPairs = queryString.split('&');
  const queryObject: Record<string, string | number> = {};

  queryPairs
    .filter(pair => pair)
    .forEach(pair => {
      const [key, value] = pair.split('=');
      queryObject[key] = isNaN(Number(value)) ? decodeURIComponent((value || '').replace(/\+/g, ' ')) : Number(value);
    });

  return queryObject;
}

// Function that takes in an object and outputs a query string
export function objectToQueryString(obj: { [key: string]: string | number }, skip_keys: string[] = []): string {
  let queryString = '';
  for (const key in obj) {
    if (obj[key] !== undefined && !skip_keys.includes(key)) queryString += `${key}=${encodeURIComponent(obj[key]).split('%20').join('+')}&`;
  }
  return queryString.slice(0, queryString.length - 1);
}
