import { test, assert } from 'vitest';
import { repeatChar } from './string-helper';

test('should repeat a character for a specified number of times', () => {
  const expected = '*****';
  const actual = repeatChar('*', 5);
  assert.equal(actual, expected);
});
