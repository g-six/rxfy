'use client';
import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
const module_name = 'HomeAlert1';
function Iterator({ className, children }: { className?: string; children: React.ReactElement }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      if (c.props.className.includes('setup-ha-1')) {
        return <SetupHomeAlertButton className={c.props.className}>{c.props.children}</SetupHomeAlertButton>;
      }
      if (c.props.className.includes('setup-ha-close')) {
        return <CloseFormButton className={c.props.className}>{c.props.children}</CloseFormButton>;
      }
      return (
        <div className={[c.props.className, 'rexified', module_name].join(' ')}>
          <Iterator>{c.props.children}</Iterator>
        </div>
      );
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
          step: 2,
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
        trigger.fireEvent({});
      }}
    >
      {convertDivsToSpans(children)}
    </button>
  );
}

export default function HomeAlert1({ className, children }: { className: string; children: React.ReactElement }) {
  const trigger = useEvent(Events.MyHomeAlertsForm);
  const { step } = trigger.data as unknown as {
    step?: number;
  };
  const [show, toggle] = React.useState(step === 1);

  React.useEffect(() => {
    toggle(step === 1);
  }, [trigger]);

  return show ? (
    <div className={[className, 'rexified', module_name].join(' ')}>
      <Iterator>{children}</Iterator>
    </div>
  ) : (
    <></>
  );
}
