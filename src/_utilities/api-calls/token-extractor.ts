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
export function getSessionAndGuidFromToken(input: string): {
  session_key: string;
  guid: string;
} {
  const [session_key, guid] = input.split('-');
  if (!session_key || !guid) throw new Error('invalid_input');
  return {
    session_key,
    guid,
  };
}
