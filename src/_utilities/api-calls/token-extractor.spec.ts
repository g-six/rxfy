import { expect, it, describe } from 'vitest';
import { retrieveBearer, getSessionAndGuidFromToken } from './token-extractor';
describe('Regex Replacer', () => {
  const string = retrieveBearer('This is a bearer token');
  const result = 'This is a token';
  it('should replace the first occurence of the word bearer with an empty string', () => {
    expect(string).toBe(result);
  });
});

describe('getSessionAndGuidFromToken', () => {
  it('should return an object with session key and guid when given a valid input', () => {
    const input = 'session_key-guid';
    const result = getSessionAndGuidFromToken(input);

    expect(result).toEqual({
      session_key: 'session_key',
      guid: 'guid',
    });
  });

  it('should throw an error when given an invalid input', () => {
    const input = 'invalid_input';
    expect(() => getSessionAndGuidFromToken(input)).toThrowError();
  });
});
