'use client';
import React from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
const module_name = 'HomeAlert3';
export default function HomeAlert3({ className, children }: { className: string; children: React.ReactElement }) {
  const trigger = useEvent(Events.MyHomeAlertsForm);
  const { step, timeout } = trigger.data as unknown as {
    step?: number;
    timeout?: number;
  };
  const [show, toggle] = React.useState(step === 3);

  React.useEffect(() => {
    toggle(step === 3);
  }, [trigger]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (show) {
        trigger.fireEvent({});
      }
    }, timeout);
    return () => clearTimeout(timer);
  }, [show]);

  return show ? <div className={[className, 'rexified', module_name].join(' ')}>{children}</div> : <></>;
}
