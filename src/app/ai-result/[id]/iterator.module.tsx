/* eslint-disable @next/next/no-img-element */
'use client';
import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import type { PutBlobResult } from '@vercel/blob';
import { Children, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';
import styles from './ai-result.module.scss';

function Replace({
  children,
  ...attributes
}: {
  children: ReactElement;
  onTab(data: EventsData): void;
  'active-tab': string;
  'active-theme': string;
  'profile-slug': string;
  'agent-id': string;
  switchTheme(theme: string): void;
}) {
  const rexified = Children.map(children, c => {
    if (c.props?.['data-theme-contents'] === attributes['active-theme']) {
      return cloneElement(
        c,
        {
          src: `/${attributes['agent-id']}/${attributes['profile-slug']}?theme=${attributes['active-theme']}`,
        },
        <iframe className={styles['theme-preview']} src={`/${attributes['agent-id']}/${attributes['profile-slug']}?theme=${attributes['active-theme']}`} />,
      );
    } else if (c.props?.['data-theme']) {
      const { children: sub, ...props } = c.props;
      if (props.className.includes('tab-button'))
        return cloneElement(
          <div
            data-theme={props['data-theme']}
            onClick={(evt: MouseEvent<HTMLDivElement>) => {
              attributes.switchTheme(evt.currentTarget.getAttribute('data-theme') as string);
            }}
          />,
          {
            ...props,
            className: c.props.className.includes('tab-button')
              ? classNames(c.props.className.split('w--current').join(''), attributes['active-theme'] === props['data-theme'] ? 'w--current' : '')
              : classNames(c.props.className.split('w--tab-active').join(''), attributes['active-theme'] === props['data-theme'] ? 'w--tab-active' : ''),
          },
          sub,
        );
      else {
        return cloneElement(
          c,
          {
            ...props,
            className: classNames(c.props.className.split('w--tab-active').join(''), attributes['active-theme'] === props['data-theme'] ? 'w--tab-active' : ''),
          },
          <Replace {...attributes}>{c.props.children}</Replace>,
        );
      }
    } else if (c.props?.['data-panel']) {
      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          {
            className: classNames(c.props.className.split('w--tab-active').join(''), attributes['active-tab'] === c.props['data-panel'] ? 'w--tab-active' : ''),
          },
          c.props?.['data-panel'] === 'property_page' ? (
            <div className='w-full h-full overflow-auto'>
              <div className='absolute z-10 h-full w-full'>{c.props.children}</div>
              <div className='relative z-20'>
                <iframe
                  className={styles['theme-preview']}
                  src={`/${attributes['agent-id']}/${attributes['profile-slug']}/property?mls=R2826531?theme=${attributes['active-theme']}`}
                />
              </div>
            </div>
          ) : (
            <Replace {...attributes}>{c.props.children}</Replace>
          ),
        );
      }
    } else if (c.props?.['data-component'] === 'private_listing') {
      return (
        <iframe
          className={styles['theme-preview']}
          src={`/${attributes['agent-id']}/${attributes['profile-slug']}/property?mls=R2826531?theme=${attributes['active-theme']}`}
        />
      );
    } else if (c.props?.children && typeof c.props.children !== 'string') {
      if (c.props['data-tab']) {
        const { children: sub, ...props } = c.props;
        return cloneElement(
          <div
            onClick={(evt: MouseEvent<HTMLDivElement>) => {
              attributes.onTab({
                tabTo: evt.currentTarget.getAttribute('data-tab'),
              } as unknown as EventsData);
            }}
          />,
          {
            ...props,
            className: classNames(c.props.className.split('w--current').join(''), attributes['active-tab'] === props['data-tab'] ? 'w--current' : ''),
          },
          sub,
        );
      }
      return cloneElement(c, {}, <Replace {...attributes}>{c.props.children}</Replace>);
    }
    return c;
  });

  return <>{rexified}</>;
}

export default function Iterator(p: { agent: AgentData; property?: PropertyDataModel; children: ReactElement }) {
  const tabs = useEvent(Events.Blank);
  const { tabTo } = tabs.data as unknown as {
    tabTo: string;
  };
  const [is_loaded, toggleLoaded] = useState(false);
  const [active_tab, setActiveTab] = useState('home_page');
  const [active_theme, setActiveTheme] = useState('oslo');

  useEffect(() => {
    if (tabTo && tabTo !== active_tab) {
      setActiveTab(tabTo);
    }
  }, [tabs.data]);

  useEffect(() => {
    toggleLoaded(true);
  }, []);

  return is_loaded ? (
    <Replace
      active-tab={active_tab}
      profile-slug={p.agent.metatags.profile_slug as string}
      agent-id={p.agent.agent_id}
      onTab={tabs.fireEvent}
      switchTheme={name => {
        setActiveTheme(name);
      }}
      active-theme={active_theme}
    >
      {p.children}
    </Replace>
  ) : (
    <></>
  );
}
