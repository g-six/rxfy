'use client';
import { Events } from '@/_typings/events';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import SpinningDots from '@/components/Loaders/SpinningDots';
import Cookies from 'js-cookie';

import { useEffect } from 'react';
export default function LogOutPage() {
  useEffect(() => {
    Cookies.remove('session_key');
    Cookies.remove('session_as');
    setData('viewing_customer', undefined);
    setData(Events.LovedItem, undefined);
    setTimeout(() => {
      location.href = location.href.split('/').reverse().slice(1).reverse().join('/');
    }, 1800);
  }, []);

  return (
    <main className='flex items-center h-screen w-screen justify-center'>
      <SpinningDots className='w-8 h-8 text-slate-700' />
    </main>
  );
}
