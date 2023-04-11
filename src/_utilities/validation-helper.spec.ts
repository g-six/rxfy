import { describe, expect, it } from 'vitest';
import { validateEmail } from './validation-helper';

describe('validateEmail', () => {
  it('should return true when a valid email is provided', () => {
    const validEmail = 'example@gmail.com';
    const result = validateEmail(validEmail);
    expect(result).toBe(true);
  });

  it('should return false when an invalid email is provided', () => {
    const invalidEmail = 'example';
    const result = validateEmail(invalidEmail);
    expect(result).toBe(false);
  });
});
