import { expect, describe, it } from 'vitest';
import { formatPhone } from '@/_utilities/formatters';

describe('formatPhone', () => {
  it('returns a properly formatted phone number', () => {
    expect(formatPhone('1234567890')).toBe('(123) 456-7890');
  });

  it('returns an empty string for an empty input', () => {
    expect(formatPhone('')).toBe('');
  });

  it('returns the input if unable to format it properly', () => {
    expect(formatPhone('123')).toBe('123');
  });
});
