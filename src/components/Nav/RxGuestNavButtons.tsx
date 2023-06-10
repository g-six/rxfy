'use client';
import useEvent, { Events } from '@/hooks/useEvent';
import Cookies from 'js-cookie';
import React from 'react';

type Props = {
  children: React.ReactElement;
  className?: string;
  show: boolean;
};

export default function RxGuestNavButtons(p: Props) {
  const evt = useEvent(Events.Logout);
  const [show, toggleShow] = React.useState(p.show);

  React.useEffect(() => {
    if (evt.data?.clicked) {
      Cookies.remove('session_key');
      toggleShow(true);
    }
  }, [evt.data?.clicked]);
  return <div className={p.className}>{show ? p.children : ''}</div>;
}
