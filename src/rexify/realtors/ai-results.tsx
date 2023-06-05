'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import useEvent, { Events } from '@/hooks/useEvent';

type Props = {
  children: React.ReactElement;
  className?: string;
};

export default function AiResult(p: Props) {
  const { data, fireEvent } = useEvent(Events.LoadUserSession);
  const [loading, toggleLoading] = React.useState(false);
  const [realtor, setRealtor] = React.useState<{
    agent_id?: string;
    realtor_id?: number;
  }>();

  const matches = [
    {
      searchFn: searchByClasses(['theme-area']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          className: 'hidden',
        });
      },
    },
  ];

  React.useEffect(() => {
    if (Cookies.get('session_key')) {
      console.log('loadingggggg');
      toggleLoading(true);
    }
  }, []);

  return <div className={[p.className, 'w-full'].join(' ')}>{transformMatchingElements(p.children, matches)}</div>;
}
