/**
 * Extract token from Authorization header
 * @param input string in form of "Bearer xxxxxxxxx"
 * @returns xxxxxxxxx
 */
export function retrieveBearer(input: string): string {
  return input.replace(/bearer\s/i, '');
}

/**
 * Extract session_key and guid from string
 * @param input sting in form of xxxxxx-y
 * @returns object { session_key: xxxxxx, guid: y }
 */
export function getTokenAndGuidFromSessionKey(input: string): {
  token: string;
  guid: number;
} {
  const [token, id] = retrieveBearer(input).split('-');
  if (!token || !id || isNaN(Number(id))) throw new Error('invalid_input');
  return {
    token,
    guid: Number(id),
  };
}
