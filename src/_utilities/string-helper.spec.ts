import { describe, it, expect, test, assert } from 'vitest';
import { emailToSlug, formatAddress, repeatChar, toKebabCase } from './string-helper';

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

describe('toKebabCase', () => {
  it('should remove non-alphanumeric characters and convert the string to kebab-case', () => {
    const inputString1 = 'Hello#World@what*is=up!';
    const result1 = toKebabCase(inputString1);
    expect(result1).toEqual('hello-world-what-is-up');

    const inputString2 = 'My-Name$is-John';
    const result2 = toKebabCase(inputString2);
    expect(result2).toEqual('my-name-is-john');

    const inputString3 = 'This is_a string!';
    const result3 = toKebabCase(inputString3);
    expect(result3).toEqual('this-is-a-string');

    const result4 = toKebabCase('This is/a string!');
    expect(result4).toEqual('this-is-a-string');

    const result5 = toKebabCase('Flooring - Tile');
    expect(result5).toEqual('flooring-tile');
  });
});
