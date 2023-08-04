'use client';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByProp } from '@/_utilities/rx-element-extractor';
import { Transition } from '@headlessui/react';
import React from 'react';
import styles from './RxDropdownMenu.module.scss';
import useEvent, { Events } from '@/hooks/useEvent';
import { RxAgentTextWrapper } from '../RxAgentInfoWrappers/RxAgentTextWrapper';
import { AgentData } from '@/_typings/agent';
import { RxButton } from '../RxButton';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';
import Cookies from 'js-cookie';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { AxiosError } from 'axios';

type Props = {
  children: React.ReactElement;
  agent?: AgentData;
  className?: string;
};
function DropdownLightbox(p: Props) {
  const evt = useEvent(Events.ToggleUserMenu);

  return (
    <Transition
      key='confirmation'
      show={evt.data?.clicked !== undefined || false}
      as='div'
      className={p.className || ''}
      enter='transform ease-out duration-200 transition'
      enterFrom='md:-translate-y-2 opacity-0 translate-y-0'
      enterTo='translate-y-0 opacity-100'
      leave='transition ease-in duration-300'
      leaveFrom='opacity-100 translate-y-0'
      leaveTo='opacity-0 md:-translate-y-2 translate-y-0'
    >
      {p.children}
    </Transition>
  );
}
export default function RxSessionDropdown(p: Props) {
  const session = useEvent(Events.LoadUserSession);
  const evt = useEvent(Events.ToggleUserMenu);
  const logout = useEvent(Events.Logout);
  const [in_session, setSession] = React.useState(false);
  const [user, setUser] = React.useState<{ [key: string]: string | number }>();

  React.useEffect(() => {
    if (logout.data?.clicked) {
      logout.fireEvent({});
      clearSessionCookies();
      setSession(false);
      setTimeout(() => {
        location.href = '/';
      }, 100);
    }
  }, [logout.data?.clicked]);

  React.useEffect(() => {
    if (session.data) {
      setUser(session.data as unknown as { [key: string]: string | number });
    }
  }, [session.data]);

  React.useEffect(() => {
    if (Cookies.get('session_key') && session.data) {
      let { session_key } = session.data as unknown as {
        session_key: string;
      };
      if (!session_key) {
        getUserBySessionKey(Cookies.get('session_key') as string, 'realtor')
          .then(data => {
            const { expires_in } = data as unknown as { expires_in: number };
            session.fireEvent(data);
            if (expires_in > 0) {
              setSession(true);
            }
          })
          .catch(e => {
            const axerr = e as AxiosError;
            if (axerr.response?.status === 401) {
              clearSessionCookies();
              setTimeout(() => {
                location.href = '/log-in';
              }, 500);
            }
          });
      }
    }
  }, []);

  const matches = [
    {
      searchFn: searchByClasses(['w-dropdown-list']),
      transformChild: (child: React.ReactElement) => (
        <DropdownLightbox className={child.props.className + ` w--open rexified ${styles.dropdown} ${styles['session-dropdown']}`}>
          {child.props.children}
        </DropdownLightbox>
      ),
    },
    {
      searchFn: searchByProp('children', 'Sign Out'),
      transformChild: (child: React.ReactElement) => (
        <RxButton {...child.props} id={`${Events.Logout}-trigger`} rx-event={Events.Logout}>
          {child.props.children}
        </RxButton>
      ),
    },
  ];

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const global = globalThis as any;
      if (global.webflow_script) {
        document.body.appendChild(global.webflow_script);
      }
    }
  }, []);

  return in_session ? (
    <ToggleIterator
      data-session={session.data}
      id={`${Events.ToggleUserMenu}-trigger`}
      onClick={elem => {
        evt.fireEvent({
          ...evt.data,
          clicked: evt.data?.clicked ? undefined : elem.currentTarget.id,
        });
      }}
    >
      <div className={p.className + ' rexified RxSessionDropdown'}>{transformMatchingElements(p.children, matches)}</div>
    </ToggleIterator>
  ) : (
    <></>
  );
}

function ToggleIterator(p: Props & { id?: string; 'data-session': unknown; onClick: React.MouseEventHandler }) {
  const session = p['data-session'] as {
    [key: string]: string;
  };

  const collection = React.Children.map(p.children, child => {
    if (!child.props) {
      return child;
    } else if (typeof child.props.children === 'string') {
      return React.cloneElement(child, {
        className: `${child?.props?.className || ''} rexified`.trim(),
      });
    } else if (child.type === 'div' && child.props.className?.indexOf('agent-name') >= 0 && child.props.className?.indexOf('rexified') === -1) {
      return (
        <div className={[child.props.className.split(' agent-name').join(''), 'rexified'].join(' ')}>
          <span>{session?.full_name}</span>
        </div>
      );
    } else if (child.type !== 'div') {
      return child;
    }
    return (
      <ToggleIterator {...child.props} data-session={p['data-session']} onClick={p.onClick}>
        {child.props.children}
      </ToggleIterator>
    );
  });

  return (
    <div className={p.className} id={p.id} onClick={p.onClick}>
      {collection}
    </div>
  );
}
