import { expect, describe, it } from 'vitest';
import { capitalizeFirstLetter, formatPhone, formatShortDate } from '@/_utilities/formatters';

describe('capitalizeFirstLetter', () => {
  it('should capitalize the first letter of each word in a string', () => {
    const result = capitalizeFirstLetter('hello world');
    expect(result).toBe('Hello World');
  });
});

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

describe('formatShortDate', () => {
  it('returns a properly formatted date', () => {
    expect(formatShortDate('03081983')).toBe('03/08/1983');
  });

  it('returns an empty string for an empty input', () => {
    expect(formatShortDate('')).toBe('');
  });

  it('returns the best guess if input in different format', () => {
    expect(formatShortDate('1-3-1994')).toBe('01/03/1994');
  });
});
