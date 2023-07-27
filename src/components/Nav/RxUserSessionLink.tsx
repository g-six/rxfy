'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { useParams, useRouter } from 'next/navigation';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';

type RxUserSessionLinkProps = {
  children: React.ReactElement;
  className: string;
  tabindex?: string;
  href: string;
};
export function RxUserSessionLink(props: RxUserSessionLinkProps) {
  const router = useRouter();
  const params = useParams();
  const [selector, toggleShow] = React.useState('hidden');

  const logout = () => {
    clearSessionCookies();
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

  let { href } = props;
  if (params['profile-slug'] && params.slug) {
    href = `/${params.slug}/${params['profile-slug']}${href}`;
  }

  return (
    <a
      {...props}
      href={href}
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
