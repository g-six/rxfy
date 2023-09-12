'use client';

import { queryStringToObject } from '@/_utilities/url-helper';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

export default function LogOut() {
  Cookies.remove('session_as');
  Cookies.remove('session_key');
  useEffect(() => {
    if (location) {
      const { redirect: url } = queryStringToObject(location.search.substring(1));
      setTimeout(() => {
        location.href = `${url || '/log-in'}`;
      }, 200);
    }
  }, []);
  return <></>;
}
