import { assert, describe, it } from 'vitest';
import { hashPassword } from './encryption-helper';

//define the test
describe('hashPassword', () => {
  it('should hash a user password', () => {
    const password = 'password123';
    const hashed = hashPassword(password);

    //assert that the user password was hashed correctly
    assert.notEqual(password, hashed);
  });
});
