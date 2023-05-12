import { describe, it, assert } from 'vitest';
import { slugifyAddressRecord } from './property-page';

describe('slugifyAddressRecord', () => {
  it('should properly slugify an address record', () => {
    const address = '123 Main Street, Anytown, US 1234';
    const record_id = 1;
    assert.equal(slugifyAddressRecord(address, record_id), '123-main-street-anytown-us-1234-1');
  });
});
