'use client';
import { ChangeEvent, Children, KeyboardEvent, ReactElement, cloneElement, useEffect, useState } from 'react';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useEvent';
import { RxNavIterator } from '@/rexify/realtors/RxNavIterator';
import { RxButton } from '@/components/RxButton';
import { consoler } from '@/_helpers/consoler';
import { login } from '@/_utilities/api-calls/call-login';

const FILE = 'log-in/log-in.page.iterator.tsx';

function EmailInput({ input, ...props }: { input: ReactElement; 'rx-file': string }) {
  const handler = useEvent(Events.Login);
  return cloneElement(input, {
    onChange: (evt: ChangeEvent<HTMLInputElement>) => {
      handler.fireEvent({
        email: evt.currentTarget.value,
        clicked: undefined,
      } as unknown as EventsData);
    },
    onKeyPress: (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.code.includes('Enter') && evt.currentTarget.value.length) {
        handler.fireEvent({ clicked: `${Events.Login}-trigger` });
      }
    },
  });
}
function PasswordInput({ input, ...props }: { input: ReactElement; 'rx-file': string }) {
  const handler = useEvent(Events.Login);
  return cloneElement(input, {
    onChange: (evt: ChangeEvent<HTMLInputElement>) => {
      handler.fireEvent({
        password: evt.currentTarget.value,
        clicked: undefined,
      } as unknown as EventsData);
    },
    onKeyPress: (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.code.includes('Enter')) {
        handler.fireEvent({ clicked: `${Events.Login}-trigger` });
      }
    },
  });
}

export function Iterator({ children, ...props }: { children: ReactElement; className?: string; 'rx-file': string; disabled?: boolean }) {
  const Rexified = Children.map(children, c => {
    if (c.type === 'input') {
      if (c.props.type === 'email') return <EmailInput input={c} rx-file={props['rx-file']} />;
      if (c.props.type === 'password') return <PasswordInput input={c} rx-file={props['rx-file']} />;
      if (c.props.type === 'submit') {
        return (
          <RxButton rx-event={Events.Login} id={`${Events.Login}-trigger`} className={c.props.className} disabled={props.disabled}>
            {c.props.value}
          </RxButton>
        );
      }
    }
    if (c.type === 'form') {
      return <Iterator {...props}>{c.props.children}</Iterator>;
    }
    if (c.props?.children && typeof c.props.children !== 'string') {
      if (c.props.className?.split(' ').includes('navigation-full-wrapper')) {
        return <RxNavIterator>{c}</RxNavIterator>;
      }
      return cloneElement(
        c,
        {
          className: classNames(c.props.className ? c.props.className : '', FILE.split('.ts').join('-r')),
        },
        <Iterator {...props}>{c.props.children}</Iterator>,
      );
    }
    return c;
  });

  return <>{Rexified}</>;
}

export default function LogInContainer({ children, ...props }: { children: ReactElement; className?: string; 'rx-file': string }) {
  const handler = useEvent(Events.Login);
  const { email, password } = handler.data as unknown as { email: string; password: string };

  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_mounting, setMounting] = useState(true);
  const [is_disabled, setDisabled] = useState(false);

  consoler(props['rx-file'], handler.data);
  useEffect(() => {
    if (handler.data?.clicked) {
      login(email, password, { is_agent: true })
        .then(response => {
          if (response.session_key) location.href = '/my-profile';
        })
        .catch(error => {
          consoler(props['rx-file'], { error });
          notify({
            category: NotificationCategory.ERROR,
            message: `We couldn't find you in our system.\n Sign up or try a different password?`,
          });
          handler.fireEvent({ clicked: undefined });
        });
    }
  }, [handler.data?.clicked]);

  useEffect(() => {
    setDisabled(!email || !password || email.split('@').length !== 2 || email.split('@')[1].length < 3 || password?.length === 0);
  }, [email, password]);

  useEffect(() => {
    setMounting(false);
  }, []);

  return is_mounting ? (
    <></>
  ) : (
    <Iterator {...props} disabled={is_disabled}>
      {children}
    </Iterator>
  );
}
