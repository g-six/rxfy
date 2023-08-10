'use client';
import React from 'react';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import { RxButton } from '@/components/RxButton';
import { createClient } from '@/_utilities/api-calls/call-clients';
import styles from './CustomerNotes.module.scss';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import Cookies from 'js-cookie';

type Props = {
  children: React.ReactElement;
  className?: string;
  onChange: (key: string, value: string | number) => void;
};

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.type === 'input') {
      if (child.props.name === 'birthday') {
        let months = 12;
        let days = 31;
        let years = new Date().getFullYear() - 100;
        return (
          <div className={child.props.className}>
            <select className='outline-none border-none' name='day' onChange={e => p.onChange('day', Number(e.currentTarget.value))}>
              {Array.from({ length: days }, () => {
                return days--;
              })
                .reverse()
                .map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
            <select className='outline-none border-none ml-2' name='month' onChange={e => p.onChange('month', Number(e.currentTarget.value))}>
              {Array.from({ length: months }, () => {
                return months--;
              })
                .reverse()
                .map(m => (
                  <option key={m} value={m}>
                    {new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date().setMonth(m - 1))}
                  </option>
                ))}
            </select>
            <select className='outline-none border-none ml-2' name='year' onChange={e => p.onChange('year', Number(e.currentTarget.value))}>
              {Array.from({ length: 82 }, () => {
                return years++;
              })
                .reverse()
                .map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </div>
        );
      }
      return React.cloneElement(child, {
        ...child.props,
        className: [child.props.className || '', 'rexified'].join(' '),
        onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
          p.onChange(evt.currentTarget.name, evt.currentTarget.value);
        },
      });
    }
    if (child.props?.children) {
      if (child.props.id === 'evt-save-client-trigger') {
        return (
          <RxButton className={child.props.className} type='button' id={child.props.id} rx-event={Events.SaveClient}>
            {child.props.children}
          </RxButton>
        );
      } else if (child.type !== 'div' && child.type !== 'form') {
        return child;
      }
      return (
        <div {...child.props}>
          <Iterator {...p} {...child.props}>
            {child.props.children}
          </Iterator>
        </div>
      );
    } else {
      return child;
    }
  });
  return <>{Wrapped}</>;
}

export default function RxCRMCustomerCreateForm(p: Props) {
  const session = useEvent(Events.LoadUserSession);
  const notifications = useEvent(Events.SystemNotification);
  const formToggle = useEvent(Events.CreateCustomerForm);
  const { active } = formToggle.data as unknown as {
    active: boolean;
  };
  const formHandler = useEvent(Events.CustomerDataChange);
  const submitHandler = useEvent(Events.SaveClient);
  const { year, month, day } = formHandler.data as unknown as {
    [key: string]: number;
  };
  let birthday;
  if (year && month && day) {
    birthday = new Date(year, month, day);
  }

  React.useEffect(() => {
    if (submitHandler.data?.clicked) {
      const { first_name, last_name, phone_number, email } = formHandler.data as unknown as {
        [key: string]: string;
      };
      let { year, month, day } = formHandler.data as unknown as {
        [key: string]: number;
      };
      console.log('formHandler.data', formHandler.data);
      if (!month) month = 1;
      if (!day) day = 1;
      if (!year) year = new Date().getFullYear() - 16;
      const birthday = year && month && day ? `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}` : undefined;
      if (first_name && last_name && email) {
        const client = {
          first_name,
          last_name,
          full_name: [first_name, last_name].join(' ').trim(),
          phone_number,
          email,
          birthday,
        };
        createClient(client)
          .then(() => {
            if (Cookies.get('session_key')) {
              getUserBySessionKey(Cookies.get('session_key') as string, 'realtor').then(d => {
                session.fireEvent({
                  ...session.data,
                  ...d,
                });
              });
              notifications.fireEvent({
                timeout: 15000,
                category: NotificationCategory.SUCCESS,
                message: ['An account for', client.full_name, 'has been created and an email has been sent to', client.email].join(' '),
              });
            }
          })
          .catch(console.error)
          .finally(() => {
            submitHandler.fireEvent({});
          });
      }
    }
  }, [submitHandler.data?.clicked]);

  return (
    <section className={['RxCRMCustomerCreateForm', active ? p.className : styles['hidden-component']].join(' ').trim()}>
      <Iterator
        onChange={(key: string, value: string | number) => {
          formHandler.fireEvent({
            [key]: value,
          });
        }}
      >
        {p.children}
      </Iterator>
    </section>
  );
}
