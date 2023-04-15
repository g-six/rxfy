'use client';

import axios from 'axios';
import useEvent, { Events } from '@/hooks/useEvent';
import React from 'react';
import { RxButton } from '../RxButton';
import { NotificationCategory } from '@/_typings/events';
import { RxPassword } from '../RxPassword';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';

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
  const { data, fireEvent } = useEvent(Events.UpdatePassword);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_loading, toggleLoading] = React.useState(false);

  const submitForm = async (password: string) => {
    if (is_loading) return;
    toggleLoading(true);
    try {
      const { searchParams } = new URL(location.href);
      const { user } = await updateAccount(searchParams.get('key') as string, { password });
      if (user) {
        notify({
          category: NotificationCategory.SUCCESS,
          message: 'Your password has been updated.  Log in using your new password',
          timeout: 3500,
        });
        setTimeout(() => {
          location.href = '/log-in';
        }, 6000);
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
    const { clicked, ...evt_data } = data;
    if (clicked === `${Events.UpdatePassword}-trigger`) {
      notify({});
      fireEvent(evt_data);
      const { password } = evt_data as unknown as { password?: string };
      if (password) {
        submitForm(password);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.clicked]);

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
