import { describe, it, expect } from 'vitest';
import { convertDateStringToDateObject } from './date-helper';

describe('convertDateStringToDateObject', () => {
  it('should convert a date string into a Date object', () => {
    expect(convertDateStringToDateObject('1/1/2020')).toEqual(new Date(2020, 0, 1));
  });
});
