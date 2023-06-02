'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { useSearchParams, useRouter } from 'next/navigation';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { searchByClasses, searchById } from '@/_utilities/rx-element-extractor';

import styles from './ai.module.scss';
import useEvent, { Events } from '@/hooks/useEvent';

type Props = {
  children: React.ReactElement;
};

export default function AiPrompt(p: Props) {
  const { data, fireEvent } = useEvent(Events.LoadUserSession);
  const params = useSearchParams();
  const router = useRouter();
  const [realtor, setRealtor] = React.useState<{
    agent_id?: string;
    realtor_id?: number;
  }>();

  const matches = [
    {
      searchFn: searchById('Enter-Your-Agent-MLS-ID-or-current-Website'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          defaultValue: realtor?.agent_id,
          onChange: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            setRealtor({
              ...realtor,
              agent_id: evt.currentTarget.value,
            });
          },
        });
      },
    },
    {
      searchFn: searchByClasses(['f-button-neutral']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(<button type='button'></button>, {
          className: `f-button-neutral ${styles.button}`,
          onClick: () => {
            router.push(`${child.props.href}?agent=${realtor?.agent_id}`);
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