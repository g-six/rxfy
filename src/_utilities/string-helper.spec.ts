import { describe, it, expect, test, assert } from 'vitest';
import { emailToSlug, formatAddress, repeatChar } from './string-helper';

test('should repeat a character for a specified number of times', () => {
  const expected = '*****';
  const actual = repeatChar('*', 5);
  assert.equal(actual, expected);
});

describe('emailToSlug', () => {
  it('should convert a valid email address into a url friendly slug', () => {
    const email = 'test@example.com';
    const expected = 'test-example-com';
    const result = emailToSlug(email);
    expect(result).toEqual(expected);
  });
});

describe('formatAddress', () => {
  test('formats a simple address string correctly', () => {
    expect(formatAddress('4th st NW')).toBe('4th St NW');
  });

  test('formats a address string with multiple words correctly', () => {
    expect(formatAddress('200 broadway st Apt 143A')).toBe('200 Broadway St Apt 143A');
  });
});
