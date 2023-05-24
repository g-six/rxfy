'use client';

import axios from 'axios';
import useEvent, { Events } from '@/hooks/useEvent';
import React from 'react';
import { RxButton } from '../RxButton';
import { NotificationCategory } from '@/_typings/events';
import { RxPassword } from '../RxPassword';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import { queryStringToObject } from '@/_utilities/url-helper';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { UserInputModel } from '@/_typings/base-user';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';

type RxUpdatePasswordPageProps = {
  type: string;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactElement;
};

export function RxUpdatePasswordPageIterator(props: RxUpdatePasswordPageProps) {
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;

    if (child_node.type === 'input') {
      if (child_node.props.type === 'submit') {
        return (
          <RxButton
            {...child_node.props}
            rx-event={Events.UpdatePassword}
            id={`${Events.UpdatePassword}-trigger`}
            disabled={props.disabled}
            loading={props.loading}
          >
            {child_node.props.value}
          </RxButton>
        );
      }
      if (child_node.props.className.split(' ').includes('txt-password')) {
        return <RxPassword {...child_node.props} rx-event={Events.UpdatePassword} name='password' />;
      }
      return <input {...child_node.props} className={[child_node.props.className || '', 'rexified'].join(' ')} />;
    } else if (child.props && child.props.children)
      return React.cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          // Wrap grandchildren too
          children: <RxUpdatePasswordPageIterator {...props}>{child.props.children}</RxUpdatePasswordPageIterator>,
        },
      );
    else return child;
  });

  return <>{wrappedChildren}</>;
}

export function RxUpdatePasswordPage(props: RxUpdatePasswordPageProps) {
  const search_params = useSearchParams();
  const { data, fireEvent } = useEvent(Events.UpdatePassword);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_loading, toggleLoading] = React.useState(false);
  let message = 'Sorry, there was a technical glitch.  Our engineers are trying to get to the bottom of it.';

  const submitForm = async (password: string) => {
    if (is_loading) return;
    toggleLoading(true);
    try {
      const { user } = await updateAccount(Cookies.get('session_key') as string, { password });
      if (user) {
        notify({
          category: NotificationCategory.SUCCESS,
          message: 'Your password has been updated and you have been automagically logged in. You will be redirected to your account page in a few second(s)',
          timeout: 4000,
          onClose: () => {
            location.href = '/my-profile';
          },
        });
      }
    } catch (e) {
      const api_error = e as { response: { statusText: string; data: { error: string } } };
      message = api_error.response.data.error;
      notify({
        category: NotificationCategory.ERROR,
        message,
      });
    }

    toggleLoading(false);
  };

  React.useEffect(() => {
    if (data?.clicked === `${Events.UpdatePassword}-trigger`) {
      const { clicked, ...evt_data } = data;
      notify({});
      fireEvent(evt_data);
      const { password } = evt_data as unknown as { password?: string };
      if (password) {
        submitForm(password);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  React.useEffect(() => {
    const params = queryStringToObject(search_params.toString() || '');
    loadSession(params);
  }, []);

  return (
    <form
      id='rx-update-password-page'
      onSubmit={e => {
        e.preventDefault();
        if (data) {
        }
      }}
    >
      <RxUpdatePasswordPageIterator {...props} disabled={is_loading} loading={is_loading} />
    </form>
  );
}

async function loadSession(search_params: Record<string, string | number | boolean>) {
  let session_key = '';
  let customer_id = '';

  if (search_params?.key) {
    session_key = search_params.key as string;
    customer_id = session_key.split('-')[1];
  }
  if (!session_key) session_key = Cookies.get('session_key') as string;

  if (session_key && session_key.split('-').length === 2) {
    const api_response = await axios
      .get('/api/check-session', {
        headers: {
          Authorization: `Bearer ${session_key}`,
        },
      })
      .catch(e => {
        console.log('RxUpdatePassword / User not logged in');
      });
    const session = api_response as unknown as {
      data?: UserInputModel & {
        session_key: string;
      };
    };

    if (session && session.data?.session_key) {
      Cookies.set('session_key', session.data?.session_key);
      return session.data;
    } else {
      clearSessionCookies();
      location.href = '/log-in';
    }
  } else {
    location.href = '/log-in';
  }
}
