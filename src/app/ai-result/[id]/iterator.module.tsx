/* eslint-disable @next/next/no-img-element */
'use client';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import Image from 'next/image';
import { Children, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';

function Replace({ children, onTab, ...attributes }: { children: ReactElement; onTab(data: EventsData): void; 'active-tab': string; 'active-image': string }) {
  const rexified = Children.map(children, c => {
    if (c.props?.['data-w-tab'] && c.props.className.includes('tab-pane')) {
      if (attributes['active-image'])
        return cloneElement(
          c,
          {
            className: classNames(c.props.className.split('w--tab-active').join(''), attributes['active-tab'] === c.props['data-w-tab'] ? 'w--tab-active' : ''),
            'data-contents': attributes['active-image'],
          },
          <div className='w-full h-full overflow-auto' data-contents={attributes['active-image']}>
            <img src={attributes['active-image']} width={'100%'} height={'auto'} alt='Image showing you how a property page would look like' />
          </div>,
        );
      return cloneElement(c, {
        className: classNames(c.props.className.split('w--tab-active').join(''), attributes['active-tab'] === c.props['data-w-tab'] ? 'w--tab-active' : ''),
      });
    } else if (c.props?.children && typeof c.props.children !== 'string') {
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
            className: classNames(c.props.className.split('w--current').join(''), attributes['active-tab'] === props['data-w-tab'] ? 'w--current' : ''),
          },
          sub,
        );
      }
      return cloneElement(
        c,
        {},
        <Replace {...attributes} onTab={onTab}>
          {c.props.children}
        </Replace>,
      );
    }
    return c;
  });

  return <>{rexified}</>;
}

export default function Iterator(p: { agent: AgentData; children: ReactElement }) {
  const tabs = useEvent(Events.Blank);
  const { tabTo } = tabs.data as unknown as {
    tabTo: string;
  };
  const [is_loaded, toggleLoaded] = useState(false);
  const [tab_image, setTabImage] = useState('');
  const [active_tab, setActiveTab] = useState('Home Page');

  useEffect(() => {
    if (active_tab === 'Property Page') setTabImage(`/api/agents/preview/default/${p.agent.agent_id}/${p.agent.metatags.profile_slug}?mls=R2825253`);
    else setTabImage('');
  }, [active_tab]);

  useEffect(() => {
    if (tabTo && tabTo !== active_tab) {
      setActiveTab(tabTo);
    }
  }, [tabs.data]);

  useEffect(() => {
    toggleLoaded(true);
  }, []);

  return is_loaded ? (
    <Replace active-tab={active_tab} active-image={tab_image} onTab={tabs.fireEvent}>
      {p.children}
    </Replace>
  ) : (
    <></>
  );
}
