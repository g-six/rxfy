'use client';

import useEvent, { Events } from '@/hooks/useEvent';
import Cookies from 'js-cookie';
import { ReactElement, cloneElement, useEffect, useState } from 'react';

export default function DataShowOn({ element, ...props }: { 'data-show-on': string; element: ReactElement }) {
  const handler = useEvent('data-show-on' as unknown as Events);
  const [is_ready, toggleReady] = useState(false);
  const [is_shown, toggleVisibility] = useState(
    (Cookies.get('session_key') && props['data-show-on'] === 'in_session') || (!Cookies.get('session_key') && props['data-show-on'] === 'out_session'),
  );

  useEffect(() => {
    if (props['data-show-on']) {
      if (handler.data?.message === 'logged-in') {
        toggleVisibility(props['data-show-on'] === 'in_session');
      } else if (handler.data?.message) {
        toggleVisibility(props['data-show-on'] === handler.data.message);
      }
    }
  }, [handler.data?.message]);

  useEffect(() => {
    toggleReady(true);
  }, []);

  return is_ready
    ? cloneElement(element, {
        style: handler.data?.show || is_shown ? { display: 'flex' } : element.props.style || undefined,
        'data-rexifier': 'data-show.client-component',
      })
    : element;
}
