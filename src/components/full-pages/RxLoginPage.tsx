'use client';

import { useRouter } from 'next/navigation';
import axios from 'axios';
import useEvent, { Events } from '@/hooks/useEvent';
import React from 'react';
import Cookies from 'js-cookie';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import { NotificationCategory } from '@/_typings/events';
import { CustomerDataModel } from '@/_typings/customer';
import { ErrorModel } from '@/_typings/error-model';

type RxLoginPageProps = {
  type: string;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactElement;
};
type LogInResponse = {
  data: {
    customers: {
      data: CustomerDataModel[];
    };
  };
  errors?: ErrorModel[];
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
      if (child_node.props.className.split(' ').includes('txt-email')) {
        return <RxEmail {...child_node.props} rx-event={Events.Login} name='email' />;
      }
      if (child_node.props.className.split(' ').includes('txt-password')) {
        return <RxPassword {...child_node.props} rx-event={Events.Login} name='password' />;
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
          children: <RxLoginPageIterator {...props}>{child.props.children}</RxLoginPageIterator>,
        },
      );
    else return child;
  });

  return <>{wrappedChildren}</>;
}

export function RxLoginPage(props: RxLoginPageProps) {
  const router = useRouter();
  const { data, fireEvent } = useEvent(Events.Login);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_loading, toggleLoading] = React.useState(false);

  const checkSession = async () => {
    if (Cookies.get('cid') && Cookies.get('session_key')) {
      const api_response = await axios
        .get(`/api/check-session/${Cookies.get('cid')}`, {
          headers: {
            Authorization: `Bearer ${Cookies.get('session_key')}`,
          },
        })
        .catch(e => {
          console.log('User not logged in');
        });

      const session = api_response as unknown as {
        data?: {
          session_key: string;
        };
      };

      console.log(session);
      if (session.data?.session_key) {
        Cookies.set('session_key', session.data?.session_key);
        setTimeout(() => {
          router.push('/my-profile');
        }, 700);
      }
    }
  };

  const submitForm = async () => {
    if (is_loading) return;
    toggleLoading(true);
    try {
      const api_response = await axios.post('/api/log-in', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const session = api_response as unknown as {
        data?: {
          customer?: {
            id: string;
            email: string;
            session_key: string;
          };
        };
      };
      if (session.data?.customer?.session_key) {
        Cookies.set('session_key', session.data.customer.session_key);
        Cookies.set('cid', session.data.customer.id);
      }
    } catch (e) {
      const error = e as { response: { statusText: string } };
      notify({
        category: NotificationCategory.Error,
        message: error.response.statusText,
      });
    }

    toggleLoading(false);
  };

  React.useEffect(() => {
    const { clicked, ...evt_data } = data;
    if (clicked === `${Events.Login}-trigger` && !is_loading) {
      notify({});
      toggleLoading(true);
      fireEvent(evt_data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  React.useEffect(() => {
    checkSession();
  }, []);

  return (
    <form
      id='rx-login-page'
      onSubmit={e => {
        e.preventDefault();
        if (!is_loading) {
          submitForm();
        }
      }}
    >
      <RxLoginPageIterator {...props} disabled={is_loading} loading={is_loading} />
    </form>
  );
}