import { describe, it, expect } from 'vitest';
import { sortArrayAlphabetically } from './array-helper';

describe('sortArrayAlphabetically', () => {
  it('sorts the array of strings in alphabetical order', () => {
    const array = ['z', 'b', 'm', 'a'];
    const result = sortArrayAlphabetically(array);

    expect(result).toEqual(['a', 'b', 'm', 'z']);
  });
});
