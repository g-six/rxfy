export function queryStringToObject(
  queryString: string
): Record<string, string> {
  const queryPairs = queryString.split('&');
  const queryObject: Record<string, string> = {};

  queryPairs.forEach((pair) => {
    const [key, value] = pair.split('=');
    queryObject[key] = value;
  });

  return queryObject;
}
