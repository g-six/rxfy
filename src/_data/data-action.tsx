'use client';

import { ChangeEvent, Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import useFormEvent, { Events } from '@/hooks/useFormEvent';
import { consoler } from '@/_helpers/consoler';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { sendMessageToRealtor } from '@/_utilities/api-calls/call-realtor';
import { loveHome, unloveByMLSId } from '@/_utilities/api-calls/call-love-home';
import { AgentData } from '@/_typings/agent';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { useRouter } from 'next/navigation';

function Iterator({
  children,
  data,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  'context-data'?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  onClick(): void;
  'fallback-context': string;
  'toggle-state': boolean;
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
            children: sub ? (
              typeof sub !== 'string' ? (
                <Iterator data={data} {...props}>
                  {c.props.children}
                </Iterator>
              ) : (
                sub
              )
            ) : undefined,
            onClick: () => {
              props.onClick();
            },
          });
        }
      }

      if (c.props['data-off-label'] && c.props['data-on-label']) {
        return cloneElement(c, {}, props['toggle-state'] ? c.props['data-on-label'] : c.props['data-off-label']);
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
  data: { [k: string]: unknown };
  'context-data'?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
  'data-action': string;
  'data-context': string;
}) {
  const router = useRouter();
  const [is_ready, toggleReady] = useState(false);
  let loved = false;
  if (props['data-action'] === 'like') {
    const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
    const { mls_id } = props['context-data'] as {
      [k: string]: string;
    };
    loved = local_loves.includes(mls_id);
  }
  const [state, setState] = useState<{ [k: string]: boolean | number | string }>({
    loved,
  });
  const form = useFormEvent(props['data-action'] as unknown as Events);

  function getState() {
    switch (props['data-action']) {
      case 'like':
        return state.loved as boolean;
      default:
        return false;
    }
  }

  useEffect(() => {}, [state]);

  useEffect(() => {
    toggleReady(true);
  }, []);

  return is_ready ? (
    <Iterator
      {...props}
      toggle-state={getState()}
      onClick={() => {
        ////////
        // Logic to the different supported actions below
        ////////
        switch (props['data-action']) {
          case 'send_message':
            const { email, message, customer_name, phone } = form.data as {
              [k: string]: string;
            };
            if (props.data && email && message) {
              const agent = props.data[props['data-context']] as AgentData;
              const send_to = {
                email: agent.email,
                name: agent.full_name,
              };
              const { origin: host } = new URL(location?.href);
              sendMessageToRealtor({
                email,
                message,
                phone,
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
                host,
              });
            }
            break;
          case 'like':
            if (props['context-data']) {
              const { mls_id } = props['context-data'] as {
                [k: string]: string;
              };
              if (props.data) {
                const agent = props.data.agent as AgentData;
                if (agent) {
                  const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
                  if (local_loves.includes(mls_id)) {
                    unloveByMLSId(mls_id);
                    setState({ ...state, loved: false });
                  } else {
                    loveHome(mls_id, agent.id);
                    setState({ ...state, loved: true });
                  }
                }
              }
            }
            break;
          case 'pdf':
            if (props['context-data']) {
              const agent = props.data.agent as AgentData;
              const { mls_id } = props['context-data'] as {
                [k: string]: string;
              };
              consoler('data-action.tsx', `No function handler for: ${props['data-action']}`, props.data);
              router.push(`/api/pdf/mls/${mls_id}?agent=${agent.agent_id}&wf=leagent-webflow-rebuild.webflow.io`);
            }
            break;
          default:
            consoler('data-action.tsx', `No function handler for: ${props['data-action']}`, props.data);
        }
      }}
    >
      {children}
    </Iterator>
  ) : (
    <>{children}</>
  );
}
