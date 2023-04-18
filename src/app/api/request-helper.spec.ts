import { describe, it, expect } from 'vitest';
import { extractBearerFromHeader } from './request-helper';

describe('extractBearerFromHeader', () => {
  it('should return token when valid header is passed', () => {
    const token = 'my-token';
    const header = `Bearer ${token}`;
    expect(extractBearerFromHeader(header)).toBe(token);
  });

  it('should return undefined when invalid header is passed', () => {
    const token = 'my-token';
    const header = `NotBearer ${token}`;
    expect(extractBearerFromHeader(header)).toBeUndefined();
  });

  it('should return undefined when no header is passed', () => {
    expect(extractBearerFromHeader()).toBeUndefined();
  });
});
