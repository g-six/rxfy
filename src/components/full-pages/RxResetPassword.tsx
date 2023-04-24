'use client';

import axios from 'axios';
import useEvent, { Events } from '@/hooks/useEvent';
import React from 'react';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { NotificationCategory } from '@/_typings/events';

type RxResetPasswordPageProps = {
  type: string;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactElement;
};

export function RxResetPasswordPageIterator(props: RxResetPasswordPageProps) {
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;

    if (child_node.type === 'input') {
      if (child_node.props.type === 'submit') {
        return (
          <RxButton
            {...child_node.props}
            rx-event={Events.ResetPassword}
            id={`${Events.ResetPassword}-trigger`}
            disabled={props.disabled}
            loading={props.loading}
          >
            {child_node.props.value}
          </RxButton>
        );
      }
      if (child_node.props.className.split(' ').includes('txt-email')) {
        return <RxEmail {...child_node.props} rx-event={Events.ResetPassword} name='email' />;
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
          children: <RxResetPasswordPageIterator {...props}>{child.props.children}</RxResetPasswordPageIterator>,
        },
      );
    else return child;
  });

  return <>{wrappedChildren}</>;
}

export function RxResetPasswordPage(props: RxResetPasswordPageProps) {
  const { data, fireEvent } = useEvent(Events.ResetPassword);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_loading, toggleLoading] = React.useState(false);

  const submitForm = async (email: string) => {
    if (is_loading) return;
    toggleLoading(true);
    try {
      const api_response = await axios.put(
        '/api/reset-password',
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (api_response.data.message) {
        notify({
          category: NotificationCategory.SUCCESS,
          message: api_response.data.message,
        });
      }
    } catch (e) {
      const error = e as { response: { statusText: string } };
      notify({
        category: NotificationCategory.ERROR,
        message: error.response.statusText,
      });
    }

    toggleLoading(false);
  };

  React.useEffect(() => {
    if (data?.clicked === `${Events.ResetPassword}-trigger`) {
      const { clicked, ...evt_data } = data;
      notify({});
      fireEvent(evt_data);
      const { email } = evt_data as unknown as { email?: string };
      if (email) {
        submitForm(email);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <form
      id='rx-reset-password-page'
      onSubmit={e => {
        e.preventDefault();
        if (data) {
        }
      }}
    >
      <RxResetPasswordPageIterator {...props} disabled={is_loading} loading={is_loading} />
    </form>
  );
}
