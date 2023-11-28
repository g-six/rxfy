import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function GET() {
  cookies().delete('session_as');
  cookies().delete('session_key');
  redirect('/');
  return NextResponse.json({ message: 'Redirecting you...' });
}
