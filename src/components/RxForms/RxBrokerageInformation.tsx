'use client';

import axios from 'axios';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';
import React, { MouseEventHandler, useState } from 'react';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxTextInput } from '../RxTextInput';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';
import { queryStringToObject } from '@/_utilities/url-helper';
import { BrokerageInputModel } from '@/_typings/agent';

type Props = {
  type: string;
  children: React.ReactElement;
  className?: string;
  data: BrokerageInputModel;
};

export function RxPageIterator(props: Props & { onSubmit: MouseEventHandler }) {
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
        if (child_node.props.className.split(' ').includes('brokerage-name-input')) {
          return <RxEmail {...child_node.props} rx-event={Events.SaveAccountChanges} name='brokerage[name]' defaultValue={props.data.name} />;
        }
        if (child_node.props.className.split(' ').includes('brokerage-address-input')) {
          return (
            <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='brokeage[full_address]' defaultValue={props.data.full_address} />
          );
        }
        if (child_node.props.className.split(' ').includes('brokerage-phone-input')) {
          return (
            <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='brokerage[phone_number]' defaultValue={props.data.phone_number} />
          );
        }
        if (child_node.props.className.split(' ').includes('brokerage-website-input')) {
          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='brokerage[website_url]' defaultValue={props.data.website_url} />;
        }
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

function validInput(data: BrokerageInputModel): {
  data?: {
    name?: string;
    full_address?: string;
    phone_number?: string;
    website_url?: string;
  };
  errors?: {
    [key: string]: string;
  };
  error?: string;
} {
  let error = '';

  // Only select fields that we need to submit to our API
  const { name, full_address, phone_number, website_url } = data;

  if (!name) {
    error = `${error}\nA valid name is required`;
  }

  if (error) {
    return { error };
  }

  return {
    data: {
      name,
      full_address,
      phone_number,
      website_url,
    },
  };
}

async function loadSession(search_params: Record<string, string | number | boolean>) {
  let session_key = '';
  let guid = '';

  if (search_params?.key) {
    session_key = search_params.key as string;
    guid = session_key.split('-')[1];
  }
  if (!session_key) session_key = Cookies.get('session_key') as string;

  if (session_key && session_key.split('-').length === 2) {
    const api_response = await axios
      .get(Cookies.get('session_as') && Cookies.get('session_as') === 'realtor' ? '/api/check-session/agent' : '/api/check-session', {
        headers: {
          Authorization: `Bearer ${session_key}`,
        },
      })
      .catch(e => {
        console.log('User not logged in');
      });
    const session = api_response as unknown as {
      data?: {
        brokerage: BrokerageInputModel;
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
    // location.href = '/log-in';
  }
}

export function RxBrokerageInformation(props: Props) {
  const search_params = useSearchParams();
  const { data, fireEvent } = useEvent(Events.SaveAccountChanges);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_processing, processing] = React.useState(false);
  const [form_data, setFormData] = useState<EventsData & BrokerageInputModel>(data as EventsData);

  const submitForm = () => {
    const updates = {
      ...form_data,
      ...data,
    } as unknown as BrokerageInputModel;
    const { data: valid_data, error } = validInput(updates);

    if (error) {
      notify({
        category: NotificationCategory.ERROR,
        message: error,
      });
    } else if (valid_data && Cookies.get('session_key')) {
      updateAccount(`${Cookies.get('session_key')}`, valid_data)
        .then(({ user }) => {
          fireEvent({
            ...data,
            ...user,
            clicked: undefined,
          });
          notify({
            category: NotificationCategory.SUCCESS,
            message: 'Profile updates saved',
            timeout: 5000,
          });
        })
        .finally(() => {
          if (data?.clicked) {
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
    if (data?.clicked === `${Events.SaveAccountChanges}-trigger`) {
      processing(true);
      fireEvent({
        ...data,
        clicked: undefined,
      });
    }
  }, [data]);

  React.useEffect(() => {
    const params = queryStringToObject(search_params.toString() || '');
    loadSession(params).then(user_data => {
      if (user_data?.brokerage) setFormData(user_data.brokerage);
    });
  }, [search_params]);

  return (
    <div id='rx-my-brokerage-info' className={props.className || ''}>
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
