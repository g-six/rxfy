import { describe, expect, it } from 'vitest';
import { getLatLonRange } from './geocoding';

describe('getLatLonRange()', () => {
  it('should return correct lat lon range', () => {
    const result = getLatLonRange(10, 10, 10);
    expect(result).toEqual({
      lat_max: 10.090437173295712,
      lat_min: 9.909562826704288,
      lon_max: 9.892939857466054,
      lon_min: 10.107060142533946,
    });
  });
});
