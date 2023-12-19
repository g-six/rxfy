'use client';

import useEvent, { Events } from '@/hooks/useEvent';
import Cookies from 'js-cookie';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';

// function Iterator({ children, message }: { children: ReactElement; message: string }) {
//   const rexified = Children.map(children, c => {
//     if (c.props?.children) {
//       if (typeof c.props.children !== 'string') return cloneElement(c, {}, <Iterator message={message}>{c.props.children}</Iterator>)
//       else if (c.props['wf-login-form-general-error-error']) {
//         // login_error
//         return cloneElement(c, {}, message)
//       }
//       return c
//     }
//   })
//   return <>{rexified}</>
// }

export default function DataShowOn({ element, ...props }: { 'data-show-on': string; element: ReactElement }) {
  const handler = useEvent('data-show-on' as unknown as Events);
  const { data } = useEvent(Events.SystemNotification);
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
