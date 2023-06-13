'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { useSearchParams, useRouter } from 'next/navigation';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { searchByClasses, searchById, searchByTagName } from '@/_utilities/rx-element-extractor';

import styles from './ai.module.scss';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import useDebounce from '@/hooks/useDebounce';
import { getAgentByParagonId } from '@/_utilities/api-calls/call-realtor';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import SearchInput from '@/components/RxSearchInput';
import { createAgentRecord } from '@/app/api/agents/model';

type Props = {
  children: React.ReactElement;
  className?: string;
};

export default function AiPrompt(p: Props) {
  const { data, fireEvent } = useEvent(Events.LoadUserSession);
  const params = useSearchParams();
  const router = useRouter();
  const [agent_id, setAgentId] = React.useState('');
  const [realtor, setRealtor] = React.useState<{
    agent_id?: string;
    realtor_id?: number;
  }>();
  const debounced = useDebounce(agent_id, 500);

  const matches = [
    {
      searchFn: searchById('Enter-Your-Agent-MLS-ID-or-current-Website'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          defaultValue: realtor?.agent_id,
          onChange: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            setAgentId(evt.currentTarget.value);
          },
          onSubmit: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            evt.preventDefault();
          },
        });
      },
    },
    {
      searchFn: searchByTagName('input'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          onChange: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            if (evt.currentTarget.name) {
              fireEvent({
                ...data,
                [evt.currentTarget.name]: evt.currentTarget.value,
              });
            }
          },
          onSubmit: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            evt.preventDefault();
          },
        });
      },
    },
    {
      searchFn: searchByTagName('form'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(<div />, {
          ...child.props,
          onSubmit: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            evt.preventDefault();
          },
        });
      },
    },
    {
      searchFn: searchById(WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL + '-trigger'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(<button type='button'></button>, {
          ...child.props,
          href: undefined,
          className: `f-button-neutral ${styles.button} ${debounced || agent_id}`,
          disabled: !debounced,
          onClick: () => {
            if (debounced) {
              getAgentByParagonId(debounced).then(data => {
                if (data && data.id) {
                  router.push(`${child.props.href}?paragon=${debounced}`);
                } else {
                  // rey+934262@leagent.com
                  setAgentId(debounced);
                  fireEvent({
                    clicked: WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK,
                    agent_id: debounced,
                  } as unknown as EventsData);
                }
              });
            }
          },
          children: React.Children.map(child.props.children, (gchild: React.ReactElement) => {
            if (gchild.type === 'div') {
              return <span className={gchild.props.className || ''}>{gchild.props.children}</span>;
            }
            return gchild;
          }),
        });
      },
    },
    {
      searchFn: searchById(WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK + '-trigger'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(<button type='button'></button>, {
          ...child.props,
          href: undefined,
          className: `f-button-neutral ${styles.button} ${debounced || agent_id}`,
          disabled: !`${(data as { [key: string]: string }).agent_id}}`,
          onClick: () => {
            const { agent_id, email, full_name, neighbourhoods, target_city, phone } = data as unknown as {
              agent_id: string;
              email: string;
              full_name: string;
              neighbourhoods: string;
              phone: string;
              target_city: string;
            };
            console.log(data);
            if (agent_id && email && full_name && neighbourhoods && target_city) {
              createAgentRecord(agent_id, email, phone, full_name, target_city, neighbourhoods).then(console.log).catch(console.error);
              // createAgent({
              //   agent_id,
              //   email,
              //   full_name,
              //   neighbourhoods,
              //   target_city,
              // });
              // getAgentByParagonId(debounced).then(data => {
              //   if (data && data.id) {
              //     router.push(`${child.props.href}?paragon=${debounced}`);
              //   } else {
              //     // rey+934262@leagent.com
              //     setAgentId(debounced);
              //     fireEvent({
              //       clicked: WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK,
              //     } as unknown as EventsData);
              //   }
              // });
            }
          },
          children: React.Children.map(child.props.children, (gchild: React.ReactElement) => {
            if (gchild.type === 'div') {
              return <span className={gchild.props.className || ''}>{gchild.props.children}</span>;
            }
            return gchild;
          }),
        });
      },
    },
  ];

  React.useEffect(() => {
    if (params.get('key')) {
      getUserBySessionKey(Cookies.get('session_key') || (params.get('key') as string), 'realtor').then(agent => {
        const { agent_id, id: realtor_id, session_key } = agent as unknown as { agent_id: string; session_key: string; id: number };
        setRealtor({
          agent_id,
          realtor_id,
        });
        setAgentId(agent_id);
        fireEvent({
          ...data,
          user: agent,
        });
        Cookies.set('session_key', session_key);
      });
    }
  }, []);

  return (
    <div
      className={[
        ...`${p.className}`.split(' '),
        data?.clicked === WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK
          ? p.className === WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK
            ? styles.show
            : styles.hide
          : (p.className === WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK && styles.hide) || styles.show,
        WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK,
        'rexified w-full',
      ].join(' ')}
    >
      {transformMatchingElements(p.children, matches)}
    </div>
  );
}
