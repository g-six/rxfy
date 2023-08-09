'use client';
import React from 'react';
import useEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useEvent';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import Cookies from 'js-cookie';
import { queryStringToObject } from '@/_utilities/url-helper';
import { saveSearch } from '@/_utilities/api-calls/call-saved-search';
const module_name = 'HomeAlert1';

function Iterator({ children, ...props }: { agent?: number; children: React.ReactElement; nelat?: number; nelng?: number; swlat?: number; swlng?: number }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      if (c.props.className.includes('setup-ha-1')) {
        return (
          <SetupHomeAlertButton className={c.props.className} {...props}>
            {c.props.children}
          </SetupHomeAlertButton>
        );
      }
      if (c.props.className.includes('setup-ha-close')) {
        return <CloseFormButton className={c.props.className}>{c.props.children}</CloseFormButton>;
      }
      return (
        <div className={[c.props.className, 'rexified', module_name].join(' ')}>
          <Iterator {...props}>{c.props.children}</Iterator>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

function SetupHomeAlertButton({
  className,
  children,
  agent,
  ...bounds
}: {
  className: string;
  children: React.ReactElement;
  agent?: number;
  nelat?: number;
  nelng?: number;
  swlat?: number;
  swlng?: number;
}) {
  const session_key = Cookies.get('session_key') || '';
  const session_as = Cookies.get('session_as') || 'customer';
  const { fireEvent } = useEvent(Events.MyHomeAlertsForm);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);

  return (
    <button
      className={className}
      type='button'
      onClick={() => {
        if (!session_key || session_as !== 'customer') {
          fireEvent({
            step: 2,
          } as unknown as EventsData);
        } else if (agent) {
          const saved_search = queryStringToObject(location.search.substring(1));
          saveSearch(
            { id: agent },
            {
              search_params: {
                ...saved_search,
                ...bounds,
              },
            },
          ).then(() => {
            notify({
              timeout: 5000,
              category: NotificationCategory.SUCCESS,
              message: `Fantastic! You'll get an alert as we get new listings based on your search preferences.`,
            });
            fireEvent({
              step: 0,
            } as unknown as EventsData);
          });
        }
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

export default function HomeAlert1({ agent, className, children }: { agent?: number; className: string; children: React.ReactElement }) {
  const { data } = useEvent(Events.MyHomeAlertsForm);
  const { bounds } = data as unknown as {
    bounds: {
      nelat: number;
      nelng: number;
      swlat: number;
      swlng: number;
    };
  };

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
      <Iterator {...bounds} agent={agent}>
        {children}
      </Iterator>
    </div>
  ) : (
    <></>
  );
}
