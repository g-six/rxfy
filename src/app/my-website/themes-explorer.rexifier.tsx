'use client';
import { Children, ReactElement, cloneElement, useEffect } from 'react';
import { AgentData } from '@/_typings/agent';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { classNames } from '@/_utilities/html-helper';
import { fireCustomEvent } from '@/_helpers/functions';
import { EventData } from 'mapbox-gl';
import Loading from '../loading';
import RxThemeSwitchConfirmation from './ThemeSwitchConfirmation.module';

function RxThemeCard({ children, ...props }: { children: ReactElement; id?: string; theme?: string; className?: string }) {
  const { data } = useEvent(Events.UpdateTheme);
  const { clicked } = useEvent(Events.Blank).data as unknown as {
    clicked?: string;
  };
  const { website_theme } = data as unknown as {
    website_theme: string;
  };

  const Rexified = Children.map(children, c => {
    const { children: sub, ...child_props } = c.props || {};
    if (sub && c.type === 'div') {
      if (child_props?.className?.includes('badge-standard')) {
        if (props.theme === website_theme)
          return clicked === `${Events.UpdateTheme}-trigger` ? (
            <div className='relative mr-8 mb-8 inline-block'>
              <Loading size='small' />
            </div>
          ) : (
            c
          );
        return <></>;
      }
      return (
        <div className={classNames('RxThemeCard-child', c.props?.className || '')}>
          <RxThemeCard {...child_props} theme={props.theme}>
            {sub}
          </RxThemeCard>
        </div>
      );
    }
    return c;
  });

  return props.id?.includes('.webflow.io') ? (
    <div
      {...props}
      className={classNames(props.className || '', 'cursor-pointer')}
      onClick={() => {
        fireCustomEvent(
          {
            website_theme: props.theme,
            webflow_domain: props.id,
            loading: true,
            clicked: `${Events.UpdateThemeConfirmation}-trigger`,
          } as unknown as EventData,
          Events.UpdateThemeConfirmation,
        );
      }}
    >
      {Rexified}
    </div>
  ) : (
    <>{Rexified}</>
  );
}

function Rexify({ children, ...props }: { children: ReactElement; 'agent-id': string }) {
  const Rexified = Children.map(children, c => {
    const { className, children: sub, ...component_props } = c.props || {};

    if (className?.includes('change-theme')) {
      return <RxThemeSwitchConfirmation className={className + ' rexified'}>{sub}</RxThemeSwitchConfirmation>;
    }

    if (c.props?.id?.includes('.webflow.io')) {
      return (
        <RxThemeCard {...component_props} className={className} theme={c.props.id.split('-')[0].toLowerCase()}>
          {sub}
        </RxThemeCard>
      );
    }

    if (sub && typeof sub.children !== 'string') {
      return cloneElement(c, {}, <Rexify {...props}>{sub}</Rexify>);
    }
    return c;
  });
  return <>{Rexified}</>;
}

export default function RxThemes({ children, realtor }: { children: ReactElement; realtor: AgentData }) {
  const { fireEvent } = useEvent(Events.UpdateTheme);

  useEffect(() => {
    fireEvent({
      webflow_domain: realtor.webflow_domain || '',
      website_theme: realtor.website_theme || '',
      clicked: undefined,
    } as unknown as EventsData);
  }, []);

  return <Rexify agent-id={realtor.agent_id}>{children}</Rexify>;
}
