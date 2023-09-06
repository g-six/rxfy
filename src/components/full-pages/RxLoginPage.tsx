'use client';

import axios, { AxiosError } from 'axios';
import useEvent, { Events } from '@/hooks/useEvent';
import React from 'react';
import Cookies from 'js-cookie';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import { NotificationCategory } from '@/_typings/events';
import { login } from '@/_utilities/api-calls/call-login';
import { hasClassName } from '@/_utilities/html-helper';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { useSearchParams } from 'next/navigation';

type RxLoginPageProps = {
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactElement;
  className: string;
};

export function RxLoginPageIterator(props: RxLoginPageProps) {
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;
    if (child_node.type === 'input') {
      if (child_node.props.type === 'submit') {
        return (
          <RxButton {...child_node.props} rx-event={Events.Login} id={`${Events.Login}-trigger`} disabled={props.disabled} loading={props.loading}>
            {child_node.props.value}
          </RxButton>
        );
      }
      if (child_node.props.className.split(' ').includes('txt-email') || child_node.props.type === 'email') {
        return <RxEmail {...child_node.props} rx-event={Events.Login} name='email' />;
      }
      if (child_node.props.className.split(' ').includes('txt-password') || child_node.props.type === 'password') {
        return <RxPassword {...child_node.props} rx-event={Events.Login} name='password' />;
      }
      return <input {...child_node.props} className={[child_node.props.className || '', 'rexified'].join(' ')} />;
    } else if (child.props && child.props.children) {
      return React.cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          // Wrap grandchildren too
          children: <RxLoginPageIterator {...props}>{child.props.children}</RxLoginPageIterator>,
        },
      );
    } else {
      return child;
    }
  });

  return <>{wrappedChildren}</>;
}

export function RxLoginPage(props: RxLoginPageProps) {
  const { data, fireEvent } = useEvent(Events.Login);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_loading, toggleLoading] = React.useState(false);
  const searchParams = useSearchParams();
  const checkSession = async (session_key: string) => {
    getUserBySessionKey(session_key, hasClassName(props.className || '', 'use-agent') ? 'realtor' : 'customer').then(session => {
      if (session) {
        if (session.session_key) {
          Cookies.set('session_key', session.session_key as string);
          setTimeout(() => {
            const [, agent_id, profile_slug, login] = location.pathname.split('/');
            if (login && login === 'log-in') {
              Cookies.set('agent_id', agent_id);
              Cookies.set('profile_slug', profile_slug);
            }
            location.href = 'my-profile';
          }, 1000);
        }
      }
    });
  };

  const submitForm = async () => {
    if (is_loading) return;
    toggleLoading(true);
    try {
      const { email, password } = data as unknown as { [key: string]: string };
      console.log('props.className', props.className);
      const api_response = await login(email, password, { is_agent: hasClassName(props.className || '', 'use-agent') })
        .catch((e: AxiosError) => {
          if (e.response && e.response.data) {
            const { error } = e.response.data as { error: string };
            if (error) {
              throw { response: { statusText: error } };
            }
          }
        })
        .finally(() => {
          toggleLoading(false);
        });

      const session = api_response as unknown as {
        user?: {
          id: string;
          email: string;
        };
        session_key: string;
      };
      if (session?.session_key && session.user?.id) {
        Cookies.set('session_key', session.session_key);
        Cookies.set('session_as', hasClassName(props.className || '', 'use-agent') ? 'realtor' : 'customer');
        setTimeout(() => {
          location.href = 'my-profile';
        }, 1400);
      } else {
        notify({
          category: NotificationCategory.ERROR,
          message: 'Wrong email or password. Please try again',
        });
      }
    } catch (e) {
      const error = e as { response: { statusText: string } };
      notify({
        category: NotificationCategory.ERROR,
        message: error.response?.statusText,
      });
    } finally {
      toggleLoading(false);
      fireEvent({ clicked: '' });
    }

    toggleLoading(false);
  };

  React.useEffect(() => {
    if (data?.clicked === `${Events.Login}-trigger` && !is_loading) {
      const { clicked, ...evt_data } = data;
      notify({});
      toggleLoading(true);
      fireEvent(evt_data);
      submitForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  React.useEffect(() => {
    let session_key = '';
    if (Cookies.get('session_key')) session_key = Cookies.get('session_key') as string;
    else {
      if (searchParams.get('key')) session_key = searchParams.get('key') as string;
    }

    if (session_key) checkSession(session_key);
  }, []);

  return (
    <form
      id='rx-login-form'
      {...props}
      onSubmit={({ preventDefault }) => {
        preventDefault();
      }}
    >
      <RxLoginPageIterator {...props} disabled={is_loading} loading={is_loading} />
    </form>
  );
}
