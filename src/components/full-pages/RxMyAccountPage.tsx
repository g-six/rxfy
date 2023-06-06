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
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';
import { queryStringToObject } from '@/_utilities/url-helper';
import { RealtorInputModel } from '@/_typings/agent';
import RxDatePicker from '@/components/RxForms/RxInputs/RxDatePicker';
import { CakeIcon } from '@heroicons/react/20/solid';

type RxMyAccountPageProps = {
  type: string;
  children: React.ReactElement;
  className?: string;
  data: CustomerInputModel & RealtorInputModel;
  'user-type': string;
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
        if (child_node.props.className.split(' ').includes('txt-firstname')) {
          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='first_name' defaultValue={props.data.first_name} />;
        }
        if (child_node.props.className.split(' ').includes('txt-lastname')) {
          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='last_name' defaultValue={props.data.last_name} />;
        }
        if (child_node.props.className.split(' ').includes('txt-phone-number')) {
          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='phone_number' defaultValue={props.data.phone_number} />;
        }
        if (child_node.props.className.split(' ').includes('txt-agentid')) {
          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='agent_id' defaultValue={props.data.agent_id} />;
        }
        if (child_node.props.className.split(' ').includes('txt-phone')) {
          return <RxPhoneInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='phone_number' defaultValue={props.data.phone_number} />;
        }
        if (child_node.props.className.split(' ').includes('txt-birthday')) {
          const adult_on = new Date();
          adult_on.setFullYear(adult_on.getFullYear() - 17);
          return (
            <RxDatePicker
              {...child_node.props}
              icon={<CakeIcon className='w-4 h-4 text-slate-600/50' />}
              rx-event={Events.SaveAccountChanges}
              name='birthday'
              defaultValue={props.data.birthday || ''}
              maxvalue={adult_on}
            />
          );
        }
      }

      if (child_node.props.id === 'chk-marketing-consent') {
        return <RxCheckBox {...child_node.props} rx-event={Events.SaveAccountChanges} name='yes_to_marketing' defaultChecked={props.data.yes_to_marketing} />;
      }

      return <input {...child_node.props} className={[child_node.props.className || '', 'rexified'].join(' ')} />;
    } else if (child.props && child.props.children) {
      if (child.props?.className?.split(' ').includes('cta-save-account')) {
        return (
          <RxButton {...child_node.props} rx-event={Events.SaveAccountChanges} id={`${Events.SaveAccountChanges}-trigger`}>
            {child_node.props.children}
          </RxButton>
        );
      }
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
    } else return child;
  });

  return <>{wrappedChildren}</>;
}

function validInput(data: CustomerInputModel | RealtorInputModel): {
  data?: CustomerInputModel | RealtorInputModel;
  errors?: {
    email?: string;
    // password?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  };
  error?: string;
} {
  let error = '';

  // Only select fields that we need to submit to our API
  const { email, full_name, phone_number } = data;
  const { birthday } = data as CustomerInputModel;
  const { first_name, last_name, agent_id } = data as RealtorInputModel;

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
      first_name,
      last_name,
      phone_number,
      birthday,
      agent_id,
    },
  };
}

async function loadSession(search_params: Record<string, string | number | boolean>, user_type = 'customer') {
  let session_key = Cookies.get('session_key') as string;
  let guid = session_key ? session_key.split('-')[1] : '';

  if (search_params?.key && !session_key) {
    session_key = search_params.key as string;
    guid = session_key.split('-')[1];
  }

  const is_realtor = `${Cookies.get('session_as') || user_type}` === 'realtor';
  if (session_key && session_key.split('-').length === 2) {
    if (session_key) {
      const api_response = await axios
        .get(`/api/check-session${is_realtor ? '/agent' : ''}`, {
          headers: {
            Authorization: `Bearer ${session_key}`,
          },
        })
        .catch(e => {
          console.log('RxMyAccountPage / User not logged in');
        });
      const session = api_response as unknown as {
        data?: (CustomerInputModel | RealtorInputModel) & {
          session_key: string;
        };
      };

      if (session && session.data?.session_key) {
        Cookies.set('session_key', session.data?.session_key);
        return session.data;
      } else {
        // clearSessionCookies();
        // location.href = '/log-in';
      }
    } else {
      console.log('session_key', session_key);
      console.log('is_realtor', is_realtor);
    }
  } else {
    // location.href = '/log-in';
  }
}

export function RxMyAccountPage(props: RxMyAccountPageProps) {
  const search_params = useSearchParams();
  const { data, fireEvent } = useEvent(Events.SaveAccountChanges);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_processing, processing] = React.useState(false);
  const [form_data, setFormData] = useState<
    EventsData & {
      agent_id?: string;
      phone?: string;
      phone_number?: string;
      email?: string;
      password?: string;
      birthday?: string;
      full_name?: string;
      first_name?: string;
      last_name?: string;
      yes_to_marketing?: boolean;
    }
  >(data as EventsData);

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
    } else if (valid_data && Cookies.get('session_key')) {
      updateAccount(`${Cookies.get('session_key')}`, {
        ...valid_data,
      })
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
    let { first_name, last_name } = data as unknown as {
      [key: string]: string;
    };

    if (!first_name) first_name = (form_data as unknown as { first_name: string })?.first_name;
    if (!last_name) last_name = (form_data as unknown as { last_name: string })?.last_name;

    const menu_name = [first_name || '', last_name || ''].join(' ').trim();

    document.querySelectorAll('.agent-name').forEach(el => {
      el.textContent = menu_name;
    });
  }, [data, form_data]);

  React.useEffect(() => {
    if (data?.clicked === `${Events.SaveAccountChanges}-trigger`) {
      processing(true);
      const { birthday: ts } = data as { birthday: number };
      let birthday;
      if (ts) {
        birthday = new Date(ts).toISOString().substring(0, 10);
        birthday = [birthday.split('-')[2], birthday.split('-')[1], birthday.split('-')[0]].join('/');
      }
      fireEvent({
        ...data,
        birthday,
        clicked: undefined,
      } as unknown as EventsData);
    }
  }, [data]);

  React.useEffect(() => {
    const params = queryStringToObject(search_params.toString() || '');
    loadSession(params, props['user-type']).then(user_data => {
      if (user_data) setFormData(user_data);
    });
  }, [search_params]);

  return (
    <div id='rx-my-account-page' className={[props.className || '', is_processing ? 'loading' : ''].join(' ').trim()}>
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
