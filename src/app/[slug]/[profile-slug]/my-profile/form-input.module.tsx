'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { emailPasswordReset, getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { AgentData } from '@/_typings/agent';
import { CustomerInputModel, CustomerRecord } from '@/_typings/customer';
import { classNames } from '@/_utilities/html-helper';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import styles from './form-input.module.scss';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import axios from 'axios';
import { useRouter } from 'next/navigation';

function Iterator({
  children,
  ...props
}: {
  children: React.ReactElement;
  agent: AgentData;
  profile: unknown;
  onChange?(evt: React.SyntheticEvent): void;
  onChangeDate?(evt: React.SyntheticEvent<HTMLSelectElement>): void;
  sendPasswordRequest?(): void;
}) {
  const Wrapped = React.Children.map(children, c => {
    if (c.props?.children && typeof c.props.children !== 'string') {
      return React.cloneElement(
        c,
        {
          ...c.props,
          className: classNames(c.props.className || '', 'rexified', 'child-of my-profile form-input.module.tsx'),
        },
        <Iterator {...props}>{c.props.children}</Iterator>,
      );
    } else if (c.props?.name && props.profile) {
      const [name] = `${c.props.name}`.split('-');
      const { [name]: value } = props.profile as { [key: string]: string | number };
      if (name === 'birthday') {
        let ymd = [0, 0, 0];
        if (value) {
          ymd = `${value}`.split('-').map(Number);
        }
        const [year, month, day] = ymd;
        return (
          <div className={classNames(c.props.className, styles.date)}>
            <div>
              <div className={value ? '' : 'no-selection'}>
                <label htmlFor='day' className='sr-only hidden'>
                  Day
                </label>
                <select id='day' name='day' autoComplete='day' value={day} onChange={props.onChangeDate}>
                  {Array.apply(null, Array(32)).map(function (x, i) {
                    if (i === 0) return <option key={'day'}>Day</option>;
                    return (
                      <option value={i} key={`day-${i}`}>
                        {i}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className={value ? '' : 'no-selection'}>
                <label htmlFor='month' className='sr-only hidden'>
                  Month
                </label>
                <select id='month' name='month' autoComplete='month' onChange={props.onChangeDate} value={month}>
                  {Array.apply(null, Array(13)).map(function (x, i) {
                    if (i === 0) return <option key='month'>Month</option>;
                    const d = new Date();
                    d.setMonth(i - 1);
                    const month = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(d);
                    return (
                      <option value={i} key={`month-${i}`}>
                        {month}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className={value ? '' : 'no-selection'}>
                <label htmlFor='year' className='sr-only hidden'>
                  Year
                </label>
                <select id='year' name='year' autoComplete='year' onChange={props.onChangeDate} value={year}>
                  {Array.apply(null, Array(90)).map(function (x, i) {
                    return <option key={`year-${i}`}>{new Date().getFullYear() - i - 16}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>
        );
      }
      if (value) {
        return React.cloneElement(c, { ...c.props, name, value, onChange: props.onChange });
      }
    } else if (c.type === 'a' && c.props?.className?.includes('reset-password')) {
      return (
        <button
          type='button'
          className={c.props.className}
          onClick={() => {
            props.sendPasswordRequest && props.sendPasswordRequest();
          }}
        >
          {convertDivsToSpans(c.props.children)}
        </button>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function Form({ children, agent }: { children: React.ReactElement; agent: AgentData }) {
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const evt = useEvent(Events.SaveAccountChanges);
  const [session_key, setSessionKey] = React.useState(Cookies.get('session_key') || '');
  const [profile, setProfile] = React.useState<unknown>();
  const [init, setInitial] = React.useState<unknown>();
  const [reset_password, toggleResetPassword] = React.useState(false);
  const router = useRouter();
  React.useEffect(() => {
    const { action } = evt.data as unknown as {
      action: 'save' | 'reset';
    };
    if (action === 'reset') setProfile(init);
    if (action === 'save') {
      const initial = init as { [k: string]: string | number };
      let updates: { [k: string]: string | number } = {};
      const changes = profile as { [k: string]: string | number };
      Object.keys(changes).forEach(k => {
        if (changes[k] !== initial[k]) {
          updates = {
            ...updates,
            [k]: changes[k],
          };
        }
      });
      if (Object.keys(updates)) {
        updateAccount(session_key, updates).then(({ session_key }: { session_key: string }) => {
          if (session_key) {
            setSessionKey(session_key);
            setInitial({
              ...initial,
              ...updates,
            });
            notify({
              timeout: 5000,
              category: NotificationCategory.SUCCESS,
              message: 'Profile changes saved',
            });
          }
        });
      }
    }
  }, [evt.data]);

  React.useEffect(() => {
    if (reset_password) {
      toggleResetPassword(false);
      const { email } = init as unknown as {
        email: string;
      };
      emailPasswordReset(email, 'customer', `${agent.agent_id}/${agent.metatags.profile_slug}`).then(({ message }: { message: string }) => {
        notify({
          timeout: 5000,
          category: NotificationCategory.SUCCESS,
          message,
        });
      });
    }
  }, [reset_password]);

  React.useEffect(() => {
    if (session_key) {
      getUserBySessionKey(session_key, 'customer')
        .then((data: unknown) => {
          setProfile(data as CustomerRecord);
          setInitial(data as CustomerRecord);
        })
        .catch(() => {
          router.push('log-in');
        });
    }
  }, []);

  return profile ? (
    <Iterator
      agent={agent}
      profile={profile}
      sendPasswordRequest={() => {
        toggleResetPassword(true);
      }}
      onChange={(evt: React.SyntheticEvent) => {
        const { name, value } = evt.currentTarget as HTMLInputElement;
        setProfile({
          ...(profile as CustomerRecord),
          [name]: value,
        });
      }}
      onChangeDate={(evt: React.SyntheticEvent<HTMLSelectElement>) => {
        const { name, value } = evt.currentTarget;
        const n = Number(value);
        if (!isNaN(n)) {
          let ymd = [0, 0, 0];
          let { birthday } = profile as CustomerRecord;
          if (birthday) {
            ymd = birthday.split('-').map(Number);
          }
          switch (name) {
            case 'day':
              ymd[2] = n;
              break;
            case 'month':
              ymd[1] = n;
              break;
            case 'year':
              ymd[0] = n;
              break;
          }
          setProfile({
            ...profile,
            birthday: ymd.map(v => (v > 9 ? v : `0${v}`)).join('-'),
          });
        }
      }}
    >
      {children}
    </Iterator>
  ) : (
    <>{children}</>
  );
}
