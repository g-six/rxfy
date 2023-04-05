import crypto from 'crypto';
export function hashPassword(password: string) {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}
