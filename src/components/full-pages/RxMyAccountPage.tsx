'use client';

import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import { RxTextInput } from '../RxTextInput';
import Cookies from 'js-cookie';
import { RxCheckBox } from '../RxCheckBox';
import { RxPhoneInput } from '../RxPhoneInput';
import { CustomerInputModel } from '@/_typings/customer';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import { RealtorInputModel } from '@/_typings/agent';
import RxDatePicker from '@/components/RxForms/RxInputs/RxDatePicker';
import { CakeIcon } from '@heroicons/react/20/solid';
import { getCleanObject } from '@/_utilities/data-helpers/key-value-cleaner';
import { useSearchParams } from 'next/navigation';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';

type RxMyAccountPageProps = {
  type: string;
  children: React.ReactElement;
  className?: string;
  data: CustomerInputModel & RealtorInputModel;
  session?: { [key: string]: string | number };
  'user-type': string;
  domain?: string;
  onChange?: (p: { [key: string]: { [key: string]: string } }) => void;
};

export function RxPageIterator(props: RxMyAccountPageProps & { onSubmit?: React.FormEventHandler }) {
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;
    if (child_node.type === 'a' && child_node.props.className && child_node.props.className.split(' ').includes('button-primary')) {
      return (
        <RxButton {...child_node.props} rx-event={Events.SaveAccountChanges} id={`${Events.SaveAccountChanges}-trigger`}>
          {child_node.props.children}
        </RxButton>
      );
    }
    if (child_node.type === 'a' && child_node.props.className && child_node.props.className.indexOf('button-secondary') >= 0) {
      return (
        <RxButton {...child_node.props} rx-event={Events.ResetForm} id={`${Events.ResetForm}-trigger`} type='reset'>
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
          return <RxEmail {...child_node.props} rx-event={Events.SaveAccountChanges} name='email' defaultValue={props.data?.email || props.session?.email} />;
        }
        if (child_node.props.className.split(' ').includes('txt-password')) {
          return <RxPassword {...child_node.props} rx-event={Events.SaveAccountChanges} name='password' />;
        }
        if (child_node.props.className.split(' ').includes('txt-name')) {
          return (
            <RxTextInput
              {...child_node.props}
              rx-event={Events.SaveAccountChanges}
              name='full_name'
              defaultValue={props.data?.full_name || props.session?.full_name}
            />
          );
        }
        if (child_node.props.className.split(' ').includes('txt-firstname')) {
          return (
            <RxTextInput
              {...child_node.props}
              rx-event={Events.SaveAccountChanges}
              name='first_name'
              defaultValue={props.data?.first_name || props.session?.first_name}
            />
          );
        }
        if (child_node.props.className.split(' ').includes('txt-lastname')) {
          return (
            <RxTextInput
              {...child_node.props}
              rx-event={Events.SaveAccountChanges}
              name='last_name'
              defaultValue={props.data?.last_name || props.session?.last_name}
            />
          );
        }
        if (child_node.props.className.split(' ').includes('txt-phone-number')) {
          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='phone_number' defaultValue={props.session?.phone_number} />;
        }
        if (child_node.props.className.split(' ').includes('txt-agentid')) {
          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name='agent_id' defaultValue={props.session?.agent_id} />;
        }
        if (props.session && child_node.props['data-field']) {
          let field_name = child_node.props['data-field'];
          const defaults = props.session as unknown as {
            [key: string]: string;
          };
          let default_value = '';
          if (defaults[field_name]) {
            default_value = defaults[field_name];
          } else {
            const metatags = props.session.metatags as unknown as {
              [k: string]: string;
            };
            default_value = metatags[child_node.props['data-field']] || '';
            return (
              <RxTextInput
                {...child_node.props}
                rx-event={Events.SaveAccountChanges}
                defaultValue={default_value}
                onChange={(val: string) => {
                  props.onChange({ metatags: { [field_name]: val } });
                }}
              />
            );
          }

          return <RxTextInput {...child_node.props} rx-event={Events.SaveAccountChanges} name={field_name} defaultValue={default_value} />;
        }
        if (child_node.props.className.split(' ').includes('txt-phone')) {
          return (
            <RxPhoneInput
              {...child_node.props}
              rx-event={Events.SaveAccountChanges}
              name='phone_number'
              defaultValue={props.data?.phone_number || props.session?.phone_number}
            />
          );
        }
        if (child_node.props.className.split(' ').includes('txt-birthday')) {
          const adult_on = new Date();
          adult_on.setFullYear(adult_on.getFullYear() - 17);
          const dmy_birthday = `${props.data?.birthday || props.session?.birthday}`;
          const [d, m, y] =
            dmy_birthday && dmy_birthday.split('/').length === 3
              ? dmy_birthday.split('/')
              : [new Date().getDate(), new Date().getMonth() + 1, new Date().getFullYear()];
          const birthday = dmy_birthday ? new Date(Number(y), Number(m) - 1, Number(d)) : new Date();

          return (
            <RxDatePicker
              {...child_node.props}
              icon={<CakeIcon className='w-4 h-4 text-slate-600/50' />}
              rx-event={Events.SaveAccountChanges}
              name='birthday'
              defaultValue={birthday}
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

export function RxMyAccountPage(props: RxMyAccountPageProps) {
  const reset = useEvent(Events.ResetForm);
  const { data, fireEvent } = useEvent(Events.SaveAccountChanges);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_processing, processing] = React.useState(false);
  const [form_data, setFormData] = React.useState<
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
  const search = useSearchParams();
  if (search.get('key') && !Cookies.get('session_key')) {
    const session_key = search.get('key') as string;
    getUserBySessionKey(session_key).then(setFormData);
  }

  const submitForm = (d = data) => {
    const updates = getCleanObject(d);

    if (updates && Cookies.get('session_key') && Cookies.get('session_as')) {
      updateAccount(`${Cookies.get('session_key')}`, updates, Cookies.get('session_as') === 'realtor')
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
    if (reset.data?.clicked) {
      reset.fireEvent({
        clicked: undefined,
      });
      fireEvent(props.session as unknown as EventsData);
      setFormData(props.session as unknown as EventsData);
    }
  }, [reset]);

  React.useEffect(() => {
    if (is_processing && Object.keys(form_data).length > 0) {
      processing(false);
      setFormData({});
      const { birthday: ts } = data as { birthday: number };
      let birthday;
      if (ts) {
        birthday = new Date(ts).toISOString().substring(0, 10);
        birthday = [birthday.split('-')[2], birthday.split('-')[1], birthday.split('-')[0]].join('/');
      }
      let { metatags } = data as unknown as {
        metatags: { [key: string]: string | number };
      };

      const form = form_data as unknown as {
        metatags: { [key: string]: string | number };
      };

      if (form.metatags && Object.keys(form.metatags).length && props.session) {
        const { id: metatag_id } = props.session.metatags as unknown as {
          id: number;
        };
        metatags = {
          ...metatags,
          ...form.metatags,
          id: metatag_id,
        };
        setFormData({});
      }

      fireEvent({
        ...data,
        metatags,
        birthday,
        clicked: undefined,
      } as unknown as EventsData);
      submitForm({
        ...data,
        metatags,
        birthday,
        clicked: undefined,
      } as unknown as EventsData);
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
      setFormData({
        ...form_data,
        ...data,
      });
    }
  }, [data]);

  React.useEffect(() => {
    if (props['user-type'] === 'customer' && Cookies.get('session_key')) {
      getUserBySessionKey(Cookies.get('session_key') as string).then(setFormData);
    }
  }, []);

  return (
    <div id='rx-my-account-page' className={[props.className || '', is_processing ? 'loading' : ''].join(' ').trim()}>
      <RxPageIterator
        {...props}
        data={form_data}
        onChange={(updates: { [key: string]: { [key: string]: string } }) => {
          Object.keys(updates).forEach(k => {
            if (typeof updates[k] === 'object') {
              const parsed = form_data as unknown as { [key: string]: unknown };
              setFormData({
                ...form_data,
                [k]: {
                  ...(parsed[k] || {}),
                  ...updates[k],
                },
              } as unknown as EventsData);
            } else {
              setFormData({
                ...form_data,
                ...updates,
              });
            }
          });
        }}
        onSubmit={e => {
          e.preventDefault();
        }}
      />
    </div>
  );
}
