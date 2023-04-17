export function queryStringToObject(queryString: string): Record<string, string | number> {
  const queryPairs = queryString.split('&');
  const queryObject: Record<string, string | number> = {};

  queryPairs.forEach(pair => {
    const [key, value] = pair.split('=');
    queryObject[key] = isNaN(Number(value)) ? value : Number(value);
  });

  return queryObject;
}
