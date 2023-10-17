'use client';
import { AgentData } from '@/_typings/agent';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { Children, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';

function Replace({ children, onTab }: { children: ReactElement; onTab(data: EventsData): void }) {
  const rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props.children !== 'string') {
      if (c.props['data-tab']) {
        const { children: sub, ...props } = c.props;
        return cloneElement(
          <div
            onClick={(evt: MouseEvent<HTMLDivElement>) => {
              onTab({
                tabTo: evt.currentTarget.getAttribute('data-w-tab'),
              } as unknown as EventsData);
            }}
          />,
          {
            ...props,
            className: c.props.className.split('w--current').join(''),
          },
          sub,
        );
      }
      return cloneElement(c, {}, <Replace onTab={onTab}>{c.props.children}</Replace>);
    }
    return c;
  });

  return <>{rexified}</>;
}

export default function Iterator(p: { agent: AgentData; children: ReactElement }) {
  const tabs = useEvent(Events.Blank);
  const [is_loaded, toggleLoaded] = useState(false);
  useEffect(() => {
    console.log('tabs.data', tabs.data);
  }, [tabs.data]);
  useEffect(() => {
    toggleLoaded(true);
  }, []);
  return is_loaded ? <Replace onTab={tabs.fireEvent}>{p.children}</Replace> : <></>;
}
