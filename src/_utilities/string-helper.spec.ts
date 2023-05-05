import { describe, it, expect, test, assert } from 'vitest';
import { emailToSlug, repeatChar } from './string-helper';

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
