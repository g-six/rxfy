/* eslint-disable @next/next/no-img-element */
'use client';
import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import type { PutBlobResult } from '@vercel/blob';
import { Children, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';

function Replace({
  children,
  ...attributes
}: {
  children: ReactElement;
  onTab(data: EventsData): void;
  'active-tab': string;
  'active-image': string;
  'active-theme': string;
  switchTheme(theme: string): void;
}) {
  const rexified = Children.map(children, c => {
    if (c.props?.['data-theme'] && attributes['active-theme'] && attributes['active-image']) {
      const { children: sub, ...props } = c.props;
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
    } else if (c.props?.['data-panel']) {
      if (attributes['active-image'] && attributes['active-tab'] === c.props?.['data-panel'])
        return cloneElement(
          c,
          {
            className: classNames(c.props.className.split('w--tab-active').join(''), attributes['active-tab'] === c.props['data-panel'] ? 'w--tab-active' : ''),
            'data-contents': attributes['active-image'],
          },
          <div className='w-full h-full overflow-auto' data-contents={attributes['active-image']}>
            <img src={attributes['active-image']} width={'100%'} height={'auto'} alt='Image showing you how a property page would look like' />
          </div>,
        );
      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          {
            className: classNames(c.props.className.split('w--tab-active').join(''), attributes['active-tab'] === c.props['data-panel'] ? 'w--tab-active' : ''),
          },
          <Replace {...attributes}>{c.props.children}</Replace>,
        );
      }
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
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const tabs = useEvent(Events.Blank);
  const { tabTo } = tabs.data as unknown as {
    tabTo: string;
  };
  const [is_loaded, toggleLoaded] = useState(false);
  const [tab_image, setTabImage] = useState('');
  const [cache, setCachedImage] = useState('');
  const [active_tab, setActiveTab] = useState('Home Page');
  const [active_theme, setActiveTheme] = useState('oslo');

  useEffect(() => {
    if (active_tab === 'property_page') {
      if (cache) {
        setTabImage(cache);
      } else {
        fetch(`/api/agents/preview/default/${p.agent.agent_id}/${p.agent.metatags.profile_slug}?mls=${p.property?.mls_id || 'R2825253'}`, {
          next: { revalidate: 3600 },
        }).then(response => {
          response.json().then(d => {
            const { url: src } = d as unknown as { url?: string };
            if (src) {
              setTabImage(src);
              setCachedImage(src);
            }
          });
        });
      }

      // setTabImage(`/api/agents/preview/default/${p.agent.agent_id}/${p.agent.metatags.profile_slug}?mls=${p.property?.mls_id || 'R2825253'}`);
    } else {
      setActiveTheme('');
      setTabImage('');
    }
  }, [active_tab]);

  useEffect(() => {
    if (tabTo && tabTo !== active_tab) {
      setActiveTab(tabTo);
    }
  }, [tabs.data]);

  useEffect(() => {
    toggleLoaded(true);
  }, []);
  console.log({ active_theme, active_tab, tab_image });
  return is_loaded ? (
    <Replace
      active-tab={active_tab}
      active-image={tab_image}
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
