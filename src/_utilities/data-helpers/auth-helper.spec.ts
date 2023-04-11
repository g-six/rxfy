import { describe, expect, it } from 'vitest';
import { randomString } from './auth-helper';

describe('randomString', () => {
  it('should generate a random string of the specified length', () => {
    const length = 20;
    const str = randomString(length);
    expect(str).to.have.lengthOf(length);
  });

  it('should generate a random string of length 40 if no length is specified', () => {
    const str = randomString();
    expect(str).to.have.lengthOf(40);
  });
});
