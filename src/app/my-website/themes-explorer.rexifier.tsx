'use client';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import useEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useEvent';
import { RxButton } from '@/components/RxButton';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import Cookies from 'js-cookie';
import { classNames } from '@/_utilities/html-helper';
import { fireCustomEvent } from '@/_helpers/functions';
import { EventData } from 'mapbox-gl';
import Loading from '../loading';
import { capitalizeFirstLetter } from '@/_utilities/formatters';

type DataContainer = {
  website_theme?: string;
  webflow_domain?: string;
};

function RxThemeCard({ children, ...props }: { children: ReactElement; id?: string; theme?: string; className?: string }) {
  const { data } = useEvent(Events.UpdateTheme);
  const { clicked, website_theme } = data as unknown as {
    webflow_domain: string;
    website_theme: string;
    clicked?: string;
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
            clicked: `${Events.UpdateTheme}-trigger`,
          } as unknown as EventData,
          Events.UpdateTheme,
        );
      }}
    >
      {Rexified}
    </div>
  ) : (
    <>{Rexified}</>
  );
}

function Rexify({ children, ...props }: { children: ReactElement; 'agent-id': string; 'form-state': 'loading' | 'enabled' | 'disabled' | 'finishing' }) {
  const Rexified = Children.map(children, c => {
    const { className, children: sub, ...component_props } = c.props || {};

    if (c.props?.id?.includes('.webflow.io')) {
      return (
        <RxThemeCard {...component_props} className={className} theme={c.props.id.split('-')[0].toLowerCase()}>
          {sub}
        </RxThemeCard>
      );
    }

    if (c.type === 'a' && className?.includes('cta-tracking-save')) {
      return (
        <RxButton
          id={Events.UpdateTheme + '-trigger'}
          rx-event={Events.UpdateTheme}
          className={className}
          type='button'
          disabled={props['form-state'] !== 'enabled'}
          loading={['loading', 'finishing'].includes(props['form-state'])}
        >
          {sub}
        </RxButton>
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
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { data, fireEvent: updateForm } = useEvent(Events.UpdateTheme);
  const { clicked, webflow_domain, website_theme } = data as unknown as DataContainer & {
    clicked: string;
  };

  useEffect(() => {
    if (clicked === `${Events.UpdateTheme}-trigger`) {
      if (realtor.metatags.id) {
        updateAccount(
          Cookies.get('session_key') as string,
          {
            webflow_domain,
            website_theme,
          },
          true,
        )
          .then(() => {
            notify({
              category: NotificationCategory.SUCCESS,
              message: `Your theme change request to ${capitalizeFirstLetter(website_theme as string)} has been logged and our team is setting it up.`,
              timeout: 3500,
            });
          })
          .finally(() => {
            updateForm({
              ...data,
              clicked: undefined,
            });
          });
      }
    }
  }, [clicked]);

  useEffect(() => {
    fireCustomEvent(
      {
        webflow_domain: realtor.webflow_domain || '',
        website_theme: realtor.website_theme || '',
      } as unknown as EventsData,
      Events.UpdateTheme,
    );
  }, []);

  return (
    <Rexify agent-id={realtor.agent_id} form-state={clicked === `${Events.UpdateTheme}-trigger` ? 'loading' : 'enabled'}>
      {children}
    </Rexify>
  );
}
