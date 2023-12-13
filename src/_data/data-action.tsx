'use client';

import { ChangeEvent, Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import useFormEvent from '@/hooks/useFormEvent';
import { consoler } from '@/_helpers/consoler';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { sendMessageToRealtor } from '@/_utilities/api-calls/call-realtor';
import { loveHome } from '@/_utilities/api-calls/call-love-home';

function Iterator({
  children,
  data,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  onClick(): void;
  'fallback-context': string;
}) {
  const rexifier = Children.map(children, c => {
    if (c.props) {
      const { children: sub, ...attribs } = c.props;
      let className = attribs.className || '';
      className = className ? `${className} rexified` : 'rexified';

      if (data) {
        let action = attribs['data-action'] || '';
        if (action) {
          return cloneElement(c, {
            ...attribs,
            className,
            onClick: () => {
              props.onClick();
            },
          });
        }
      }

      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          {
            className,
          },
          <Iterator data={data} {...props}>
            {sub}
          </Iterator>,
        );
      }

      return c;
    }
    return c;
  });
  return <>{rexifier}</>;
}

export default function DataAction({
  children,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
  'data-action': string;
  'data-context': string;
}) {
  const [is_ready, toggleReady] = useState(false);
  const form = useFormEvent(props['data-action']);

  useEffect(() => {
    toggleReady(true);
  }, []);

  return is_ready ? (
    <Iterator
      {...props}
      onClick={(action: string) => {
        switch (action) {
          case 'send_message':
            const { email, message, customer_name } = form.data;
            if (props.data && email && message) {
              const agent = props.data[props['data-context']];
              const send_to = {
                email: agent.email,
                name: agent.full_name,
              };
              const { origin: host } = new URL(location?.href);
              sendMessageToRealtor(
                {
                  email,
                  message,
                  customer_name:
                    customer_name ||
                    email
                      .split('@')[0]
                      .replace(/[^\w\s!?]/g, ' ')
                      .replace(/\d+/g, '')
                      .split(' ')
                      .map(capitalizeFirstLetter)
                      .join(' '),
                  send_to,
                },
                host,
              );
            }
            break;
          case 'like':
            consoler('data-action.tsx', 'Like ' + props.data.mls_id);
            loveHome(props.data.mls_id, props.data.agent);
            break;
          default:
            consoler('data-action.tsx', `No function handler for: ${action}`, props.data);
        }
        form.fireEvent({
          action,
        });
      }}
    >
      {children}
    </Iterator>
  ) : (
    <>{children}</>
  );
}
