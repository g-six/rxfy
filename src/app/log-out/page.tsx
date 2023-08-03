'use client';

import Cookies from 'js-cookie';
import { redirect } from 'next/navigation';

export default function LogOut() {
  Cookies.remove('session_as');
  Cookies.remove('session_key');
  redirect('log-in');
  return <></>;
}
