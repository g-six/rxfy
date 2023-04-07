import { assert, describe, it } from 'vitest';
import { encrypt } from './encryption-helper';

//define the test
describe('encrypt', () => {
  it('should hash a user password', () => {
    const actual = encrypt('test123');
    const expected = 'a7da5b2b8c903ddf2e4699d948bb249cdc444b25a36ef3b053572d0f4ad97938';

    assert.equal(actual, expected, 'Should encrypt password');
  });
});
