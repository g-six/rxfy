import crypto from 'crypto';

export function encrypt(password: string) {
  const secret = process.env.NODE_ENV === 'test' ? `${process.env.VITE_NEXT_APP_SECRET}` : `${process.env.NEXT_APP_SECRET}`;
  if (!secret) {
    console.error('Please set NEXT_PUBLIC_APP_SECRET env var!');
    return '';
  }
  const encrypted = crypto.createHmac('sha256', secret).update(password).digest('hex');
  return encrypted;
}
