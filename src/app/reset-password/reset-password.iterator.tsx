'use client';
import { consoler } from '@/_helpers/consoler';
import { classNames } from '@/_utilities/html-helper';
import { RxButton } from '@/components/RxButton';
import useEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useEvent';
import { RxNavIterator } from '@/rexify/realtors/RxNavIterator';
import { ChangeEvent, Children, KeyboardEvent, ReactElement, cloneElement, useEffect, useState } from 'react';

function EmailInput({ input, ...props }: { input: ReactElement; 'rx-file': string }) {
  const handler = useEvent(Events.ResetPassword);
  return cloneElement(input, {
    onChange: (evt: ChangeEvent<HTMLInputElement>) => {
      handler.fireEvent({
        email: evt.currentTarget.value,
      } as unknown as EventsData);
    },
    onKeyPress: (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.code.includes('Enter')) {
        handler.fireEvent({ clicked: Events.ResetPassword });
      }
    },
  });
}

export function Iterator({ children, ...props }: { children: ReactElement; className?: string; 'rx-file': string; disabled?: boolean; 'agent-id'?: string }) {
  const Rexified = Children.map(children, c => {
    if (c.type === 'input') {
      if (c.props.type === 'email') return <EmailInput input={c} rx-file={props['rx-file']} />;
      if (c.props.type === 'submit') {
        return (
          <RxButton rx-event={Events.ResetPassword} id={`${Events.ResetPassword}-trigger`} className={c.props.className} disabled={props.disabled}>
            {c.props.value}
          </RxButton>
        );
      }
    }
    if (c.props?.children && typeof c.props.children !== 'string') {
      if (c.props.className?.split(' ').includes('navigation-full-wrapper')) {
        return <RxNavIterator>{c}</RxNavIterator>;
      }
      if (c.type === 'form') {
        return <Iterator {...props}>{c.props.children}</Iterator>;
      }
      return cloneElement(
        c,
        {
          className: classNames(
            props['agent-id'] ? `agent-record-${props['agent-id']}` : '',
            c.props.className ? c.props.className : '',
            props['rx-file'].split('.ts').join('-r'),
          ),
        },
        <Iterator {...props}>{c.props.children}</Iterator>,
      );
    }
    return c;
  });

  return <>{Rexified}</>;
}

export default function ResetPasswordContainer({ children, ...props }: { children: ReactElement; className?: string; 'rx-file': string; 'agent-id'?: string }) {
  const handler = useEvent(Events.ResetPassword);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_mounting, setMounting] = useState(true);
  const { email } = handler.data as unknown as { email: string };

  useEffect(() => {
    if (handler.data?.clicked) {
      if (email) {
        fetch('/api/reset-password' + (props['agent-id'] ? '' : '/realtor'), {
          method: 'PUT',
          body: JSON.stringify({ email }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(response => {
            if (response.ok) {
              response.json().then(({ message }) => {
                notify({
                  category: NotificationCategory.SUCCESS,
                  message,
                });
              });
            } else {
              response.json().then(({ error }: { error: string }) => {
                notify({
                  category: NotificationCategory.ERROR,
                  message: error,
                });
              });
            }
          })
          .catch(error => {
            error.json().then((api_error: { data?: { error?: string } }) => {
              notify({
                category: NotificationCategory.ERROR,
                message: api_error.data?.error,
              });
            });
          })
          .finally(() => {
            handler.fireEvent({ clicked: undefined });
          });
      }
    }
  }, [handler.data?.clicked]);

  useEffect(() => {
    setMounting(false);
  }, []);
  return is_mounting ? (
    <></>
  ) : (
    <Iterator {...props} disabled={!email || email.split('@').length !== 2 || email.split('@')[1].length < 3}>
      {children}
    </Iterator>
  );
}
