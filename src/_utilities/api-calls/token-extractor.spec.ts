import { expect, it, describe } from 'vitest';
import { retrieveBearer, getTokenAndGuidFromSessionKey } from './token-extractor';
describe('Regex Replacer', () => {
  const string = retrieveBearer('This is a bearer token');
  const result = 'This is a token';
  it('should replace the first occurence of the word bearer with an empty string', () => {
    expect(string).toBe(result);
  });
});

describe('getTokenAndGuidFromSessionKey', () => {
  it('should parse token from input string', () => {
    const { token } = getTokenAndGuidFromSessionKey('token-123');
    expect(token).toEqual('token');
  });

  it('should parse guid from input string', () => {
    const { guid } = getTokenAndGuidFromSessionKey('token-123');
    expect(guid).toEqual(123);
  });

  it('should throw error when input is invalid', () => {
    expect(() => getTokenAndGuidFromSessionKey('abc')).toThrowError('invalid_input');
  });

  it('should throw error when id portion is invalid', () => {
    expect(() => getTokenAndGuidFromSessionKey('abc-xyz')).toThrowError('invalid_input');
  });
});
