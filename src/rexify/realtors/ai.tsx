'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { useSearchParams, useRouter } from 'next/navigation';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { searchByClasses, searchById, searchByTagName } from '@/_utilities/rx-element-extractor';

import styles from './ai.module.scss';
import useEvent, { Events } from '@/hooks/useEvent';
import useDebounce from '@/hooks/useDebounce';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { getAgentByParagonId } from '@/_utilities/api-calls/call-realtor';

type Props = {
  children: React.ReactElement;
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
      searchFn: searchByClasses(['f-button-neutral']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(<button type='button'></button>, {
          className: `f-button-neutral ${styles.button}`,
          disabled: !debounced,
          onClick: () => {
            if (debounced) {
              getAgentByParagonId(debounced).then(data => {
                if (data && data.id) {
                  router.push(`${child.props.href}?paragon=${debounced}`);
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

  return <div className={[WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL, 'w-full'].join(' ')}>{transformMatchingElements(p.children, matches)}</div>;
}
