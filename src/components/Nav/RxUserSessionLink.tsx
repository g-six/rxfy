'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { useRouter } from 'next/navigation';

type RxUserSessionLinkProps = {
  children: React.ReactElement;
  className: string;
  tabindex?: string;
  href: string;
};
export function RxUserSessionLink(props: RxUserSessionLinkProps) {
  const router = useRouter();
  const [selector, toggleShow] = React.useState('hidden');

  const logout = () => {
    Cookies.remove('session_key');
    Cookies.remove('guid');
    Cookies.remove('last_activity_at');
    router.push('/');
  };

  React.useEffect(() => {
    if (props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.USER_MENU)) {
      if (Cookies.get('session_key')) {
        toggleShow('nice');
      }
    }
    if (props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.GUEST_MENU)) {
      if (!Cookies.get('session_key')) {
        toggleShow('nice');
      }
    }
  }, []);

  return (
    <a
      {...props}
      className={[props.className, 'rexified flex w-full', selector].join(' ')}
      onClick={e => {
        // Logout button clicked
        // Also a workaround to the wrong logout link (designer bug)
        if (props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.USER_MENU)) {
          if (props.children.type === 'div' && typeof props.children.props.children === 'string') {
            if (props.children.props.children.toLowerCase() === 'logout') {
              e.preventDefault();
              logout();
            }
          } else if (e.currentTarget.innerText === 'Logout') {
            e.preventDefault();
            logout();
          }
        }
      }}
    >
      {props.children.type === 'div' ? props.children.props.children : props.children}
    </a>
  );
}
