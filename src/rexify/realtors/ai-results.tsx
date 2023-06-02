'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchById } from '@/_utilities/rx-element-extractor';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';

type Props = {
  children: React.ReactElement;
};

export default function AiResult(p: Props) {
  const [realtor, setRealtor] = React.useState<{
    agent_id?: string;
    realtor_id?: number;
  }>();
  if (Cookies.get('session_key') && !realtor) {
    getUserBySessionKey(Cookies.get('session_key') as string).then(agent => {
      console.log(agent);
      const { agent_id, id: realtor_id, session_key } = agent as unknown as { agent_id: string; session_key: string; id: number };
      setRealtor({
        agent_id,
        realtor_id,
      });
      Cookies.set('session_key', session_key);
    });
  }
  const matches = [
    {
      searchFn: searchByClasses(['logo-n-contact']),
      transformChild: (child: React.ReactElement) => {
        return replaceAllTextWithBraces(child, { 'Agent Name': 'Test' });
        // return React.cloneElement(child, {
        //   defaultValue: realtor?.agent_id,
        //   onChange: (evt: React.KeyboardEvent<HTMLInputElement>) => {
        //     setRealtor({
        //       ...realtor,
        //       agent_id: evt.currentTarget.value,
        //     });
        //   },
        // });
      },
    },
  ];
  return <div className={[WEBFLOW_NODE_SELECTOR.AI_THEME_PANE, 'w-full'].join(' ')}>{transformMatchingElements(p.children, matches)}</div>;
}
