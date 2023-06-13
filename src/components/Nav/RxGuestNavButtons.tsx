'use client';
import useEvent, { Events } from '@/hooks/useEvent';
import Cookies from 'js-cookie';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className?: string;
};

export default function RxGuestNavButtons(p: Props) {
  const evt = useEvent(Events.Logout);
  const [hide, hideMenu] = React.useState(false);

  React.useEffect(() => {
    if (evt.data?.clicked) {
      Cookies.remove('session_key');
      hideMenu(true);
    }
  }, [evt.data?.clicked]);
  return <div className={p.className + ' RxGuestNavButtons'}>{!Cookies.get('session_key') || hide ? p.children : ''}</div>;
}
