import { describe, expect, it } from 'vitest';
import { getSelectedPropertyTypes } from './dwelling-type-helper';

describe('getSelectedPropertyTypes', () => {
  it('returns the correct property types for the given property type', () => {
    expect(getSelectedPropertyTypes('house')).toEqual(['Single Family Detached', 'Residential Detached', 'House with Acreage', 'House/Single Family']);
    expect(getSelectedPropertyTypes('aptcondo')).toEqual(['Apartment/Condo']);
    expect(getSelectedPropertyTypes('tnhouse')).toEqual(['Townhouse']);
    expect(getSelectedPropertyTypes('duplex')).toEqual(['Half Duplex', '1/2 Duplex', 'Duplex']);
    expect(getSelectedPropertyTypes('nonstrata')).toEqual(['Row House (Non-Strata)']);
    expect(getSelectedPropertyTypes('manufactured')).toEqual(['Manufactured', 'Manufactured with Land']);
    expect(getSelectedPropertyTypes('others')).toEqual(['Other']);
    expect(getSelectedPropertyTypes('invalid')).toEqual([]);
  });
});
