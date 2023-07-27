'use client';
import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { useSearchParams } from 'next/navigation';
import { signUp } from '@/_utilities/api-calls/call-signup';

const module_name = 'HomeAlert2';

function Iterator({ onChange, children }: { onChange(evt: React.SyntheticEvent): void; children: React.ReactElement }) {
  const Wrapped = React.Children.map(children, c => {
    if (['div', 'form'].includes(c.type as string)) {
      if (c.props?.className?.includes('setup-ha-close')) {
        return <CloseFormButton className={c.props.className}>{c.props.children}</CloseFormButton>;
      }
      return (
        <div className={[c.props.className, 'rexified', module_name].join(' ')}>
          <Iterator onChange={onChange}>{c.props.children}</Iterator>
        </div>
      );
    } else if (c.type === 'a' && c.props?.className?.includes('setup-ha-2')) {
      return <SetupHomeAlertButton className={c.props.className}>{c.props.children}</SetupHomeAlertButton>;
    } else if (c.type === 'input') {
      return React.cloneElement(c, { ...c.props, onChange });
    }
    return c;
  });
  return <>{Wrapped}</>;
}

function SetupHomeAlertButton({ className, children }: { className: string; children: React.ReactElement }) {
  const { fireEvent } = useEvent(Events.MyHomeAlertsForm);
  return (
    <button
      className={className}
      type='button'
      onClick={() => {
        fireEvent({
          step: 3,
          timeout: 7200,
        } as unknown as EventsData);
      }}
    >
      {convertDivsToSpans(children)}
    </button>
  );
}

function CloseFormButton({ className, children }: { className: string; children: React.ReactElement }) {
  const trigger = useEvent(Events.MyHomeAlertsForm);
  return (
    <button
      className={className}
      type='button'
      onClick={() => {
        trigger.fireEvent({
          show: false,
          step: undefined,
        } as unknown as EventsData);
      }}
    >
      {convertDivsToSpans(children)}
    </button>
  );
}

export default function HomeAlert2({ className, children }: { className: string; children: React.ReactElement }) {
  const search = useSearchParams();
  const trigger = useEvent(Events.MyHomeAlertsForm);
  const { step } = trigger.data as unknown as {
    step?: number;
  };
  const [show, toggle] = React.useState(step === 2);
  const [email, setEmail] = React.useState('');

  const onEmailInput = (evt: React.SyntheticEvent<HTMLInputElement>) => {
    setEmail(evt.currentTarget.value);
  };

  React.useEffect(() => {
    toggle(step === 2);
  }, [trigger]);

  React.useEffect(() => {
    if (step === 3 && email) {
      setEmail('');
      signUp({ id: 1 }, { email }, { search_url: search.toString() }).then(console.log).catch(console.error);
    }
  }, [step]);

  return show ? (
    <div className={[className, 'rexified', module_name].join(' ')}>
      <Iterator onChange={onEmailInput}>{children}</Iterator>
    </div>
  ) : (
    <></>
  );
}
