'use client';

import axios from 'axios';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';
import React, { MouseEventHandler, useState } from 'react';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import { RxTextInput } from '../RxTextInput';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';
import { RxCheckBox } from '../RxCheckBox';
import { RxPhoneInput } from '../RxPhoneInput';
import { CustomerInputModel } from '@/_typings/customer';
import { RxBirthdayTextInput } from '../RxForms/RxBirthdayTextInput';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';

type RxMyAccountPageProps = {
  type: string;
  children: React.ReactElement;
  className?: string;
  data: CustomerInputModel;
};

export function RxPageIterator(props: RxMyAccountPageProps & { onSubmit: MouseEventHandler }) {
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;
    if (child_node.type === 'a' && child_node.props.className && child_node.props.className.split(' ').includes('button-primary')) {
      return (
        <RxButton {...child_node.props} rx-event={Events.SaveAccountChanges} id={`${Events.SaveAccountChanges}-trigger`}>
          {child_node.props.children}
        </RxButton>
      );
    }

    if (child_node.type === 'input') {
      if (child_node.props.type === 'submit') {
        return (
          <RxButton {...child_node.props} rx-event={Events.SignUp} id='signup-button'>
            {child_node.props.value}
          </RxButton>
        );
      }
      if (child_node.props.className) {
        if (child_node.props.className.split(' ').includes('button-primary')) {
          return (
            <RxButton {...child_node.props} rx-event={Events.SaveAccountChanges} id={`${Events.SaveAccountChanges}-trigger`}>
              {child_node.props.value}
            </RxButton>
          );
        }
        if (child_node.props.className.split(' ').includes('txt-email')) {
          return <RxEmail {...child_node.props} rx-event={Events.SaveAccountChanges} name='email' defaultValue={props.data.email} />;
        }
        if (child_node.props.className.split(' ').includes('txt-password')) {
          return <RxPassword {...child_node.props} rx-event={Events.SaveAccountChanges} name='password' />;
        }
        if (child_node.props.className.split(' ').includes('txt-name')) {
          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='full_name' defaultValue={props.data.full_name} />;
        }
        if (child_node.props.className.split(' ').includes('txt-phone')) {
          return <RxPhoneInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='phone_number' defaultValue={props.data.phone_number} />;
        }
        if (child_node.props.className.split(' ').includes('txt-birthday')) {
          return <RxBirthdayTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='birthday' defaultValue={props.data.birthday || ''} />;
        }
      }

      if (child_node.props.id === 'chk-marketing-consent') {
        return <RxCheckBox {...child_node.props} rx-event={Events.SaveAccountChanges} name='yes_to_marketing' defaultChecked={props.data.yes_to_marketing} />;
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
          children: <RxPageIterator {...props}>{child.props.children}</RxPageIterator>,
        },
      );
    else return child;
  });

  return <>{wrappedChildren}</>;
}

function validInput(data: CustomerInputModel & { agent_id?: number }): {
  data?: CustomerInputModel;
  errors?: {
    email?: string;
    // password?: string;
    full_name?: string;
  };
  error?: string;
} {
  let error = '';

  // Only select fields that we need to submit to our API
  const { email, full_name, phone_number, birthday } = data;

  if (!email) {
    error = `${error}\nA valid email is required`;
  }

  if (!full_name) {
    error = `${error}\nYour realtor would need your name`;
  }

  if (error) {
    return { error };
  }

  return {
    data: {
      email,
      full_name,
      phone_number,
      birthday,
    },
  };
}

async function loadSession(search_params: string[]) {
  let session_key = '';
  let customer_id = '';
  if (search_params.length) {
    const [key_from_params] = search_params.filter(kv => {
      const [key, val] = kv.split('=');
      return key === 'key' && val;
    });

    if (key_from_params) {
      session_key = key_from_params.split('-')[0].split('=')[1];
      customer_id = key_from_params.split('-')[1];
    }
  }
  if (!customer_id) customer_id = Cookies.get('guid') as string;
  if (!session_key) session_key = Cookies.get('session_key') as string;

  if (customer_id && session_key) {
    const api_response = await axios
      .get(`/api/check-session/${customer_id}`, {
        headers: {
          Authorization: `Bearer ${session_key}`,
        },
      })
      .catch(e => {
        console.log('User not logged in');
      });
    const session = api_response as unknown as {
      data?: CustomerInputModel & {
        session_key: string;
      };
    };

    if (session && session.data?.session_key) {
      if (!Cookies.get('session_key')) {
        setTimeout(() => {
          location.href = '/my-profile';
        }, 300);
      }
      Cookies.set('session_key', session.data?.session_key);
      Cookies.set('guid', customer_id);
      return session.data;
    } else {
      Cookies.remove('session_key');
      Cookies.remove('guid');
      location.href = '/log-in';
    }
  } else {
    // No session cookies
    location.href = '/log-in';
  }
}

export function RxMyAccountPage(props: RxMyAccountPageProps) {
  const search_params = useSearchParams();
  const { data, fireEvent } = useEvent(Events.SaveAccountChanges);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_processing, processing] = React.useState(false);
  const [form_data, setFormData] = useState<
    EventsData & {
      email?: string;
      password?: string;
      birthday?: string;
      full_name?: string;
      yes_to_marketing?: boolean;
    }
  >(data);

  const submitForm = () => {
    const updates = {
      ...form_data,
      ...data,
    } as unknown as {
      email?: string;
      password?: string;
      full_name?: string;
      birthday?: string;
      yes_to_marketing?: boolean;
    };
    const { data: valid_data, error } = validInput(updates);

    if (error) {
      notify({
        category: NotificationCategory.ERROR,
        message: error,
      });
    } else if (valid_data) {
      updateAccount(`${Cookies.get('session_key')}-${Cookies.get('guid')}`, valid_data)
        .then(({ customer }) => {
          fireEvent({
            ...data,
            ...customer,
            clicked: undefined,
          });
          notify({
            category: NotificationCategory.SUCCESS,
            message: 'Profile updates saved',
            timeout: 5000,
          });
        })
        .finally(() => {
          if (data.clicked) {
            fireEvent({
              ...data,
              clicked: undefined,
            });
          }
        });
    }
  };

  React.useEffect(() => {
    if (is_processing) {
      processing(false);
      submitForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is_processing]);

  React.useEffect(() => {
    if (data.clicked === `${Events.SaveAccountChanges}-trigger`) {
      processing(true);
      fireEvent({
        ...data,
        clicked: undefined,
      });
    }
  }, [data]);

  React.useEffect(() => {
    loadSession((search_params.toString() || '').split('&')).then(user_data => {
      if (user_data) setFormData(user_data);
    });
  }, []);

  return (
    <div id='rx-my-account-page' className={props.className || ''}>
      <RxPageIterator
        {...props}
        data={form_data}
        onSubmit={e => {
          e.preventDefault();
          fireEvent({
            ...data,
            clicked: `${Events.SaveAccountChanges}-trigger`,
          });
        }}
      />
    </div>
  );
}
