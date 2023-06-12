'use client';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import RxKeyValueRow from '@/components/RxProperty/RxKeyValueRow';
import { RxMyAccountPage } from '@/components/full-pages/RxMyAccountPage';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import React from 'react';
import RxLeftMenuTab from './realtors/RxLeftMenuTab';
import useEvent, { Events } from '@/hooks/useEvent';
import { BrokerageInformationForm } from './realtors/brokerage-information';
import { BrokerageDataModel } from '@/_typings/brokerage';
import RxBrandPreferences from './realtors/brand-preferences';
import { RxButton } from '@/components/RxButton';
import { buildNavigationComponent } from './realtors/RxNavIterator';

type Props = {
  className?: string;
  data?: { [key: string]: string | number };
  session?: { [key: string]: string | number };
  children: JSX.Element;
};

export default function MyProfilePage(p: Props) {
  const params = useSearchParams();
  const [session, setSession] = React.useState<{ [key: string]: string | number }>();
  const scripts: { [key: string]: string }[] = [];
  const [dash_area, setDashArea] = React.useState<React.ReactElement>();
  const [navigation_wrapper, setNavBar] = React.useState<React.ReactElement>();

  let html_props: { [key: string]: string } = {};

  React.useEffect(() => {
    if (Cookies.get('session_key')) {
      getUserBySessionKey(Cookies.get('session_key') as string, 'realtor')
        .then(data => {
          if (data.error) location.href = '/log-in';
          if (p.children.type === 'html') {
            Object.keys(p.children.props).forEach((key: string) => {
              if (key !== 'children') {
                html_props = {
                  ...html_props,
                  [key]: p.children.props[key],
                };
              } else {
                p.children.props[key].forEach((child: React.ReactElement) => {
                  if (child.type === 'body') {
                    child.props.children.forEach((div: React.ReactElement) => {
                      if (div.type === 'div') {
                        setNavBar(buildNavigationComponent(div.props.children, { ...p, session: data }));
                        setDashArea(buildMainComponent(div.props.children, { ...p, session: data }));
                      } else if (div.type === 'script') {
                        scripts.push({
                          src: div.props.src,
                          type: div.props.type,
                        });
                      }
                    });
                  }
                });
              }
            });
            setSession(data);
          }
        })
        .catch(e => {
          const axerr = e as AxiosError;
          if (axerr.response?.status === 401) {
            clearSessionCookies();
            setTimeout(() => {
              location.href = '/log-in';
            }, 200);
          }
        });
    } else {
      if (params.get('key')) {
        Cookies.set('session_key', params.get('key') as string);
        setTimeout(() => {
          location.reload();
        }, 200);
      } else {
        location.href = '/log-in';
      }
    }
  }, []);

  return session && session.session_key ? (
    <>
      <div className='dash-wrapper rexified'>
        {navigation_wrapper}
        {dash_area}
      </div>
      {scripts.map(({ src, type }) => (
        <Script key={src.split('/').pop()} src={src} type={type} />
      ))}
    </>
  ) : (
    <></>
  );
}

function buildMainComponent(children: React.ReactElement[], container_props: Props) {
  const [wrapper] = children
    .filter(f => f.props.className.split(' ').includes('dash-area'))
    .map(({ props }) => {
      return (
        <div key='dash-area' className={[props.className, 'rexified'].join(' ')}>
          <RxPageIterator session={container_props.session}>{props.children}</RxPageIterator>
        </div>
      );
    });

  return wrapper || <></>;
}

export function RxPageIterator(props: Props) {
  const { data: active_data } = useEvent(Events.DashboardMenuTab);
  const { data: brand_preferences, fireEvent: updateBrandPreferences } = useEvent(Events.UpdateBrandPreferences);
  const { tab: active_tab } = active_data as unknown as { tab?: string };

  const wrappedChildren = React.Children.map(props.children, child => {
    if (child.props && child.props.children) {
      if (child.props?.className?.split(' ').includes('dash-tabs')) {
        return React.cloneElement(child, {
          children: React.Children.map(child.props.children, RxLeftMenuTab),
        });
      }
      if (child.props?.className?.split(' ').includes('my-account-wrapper')) {
        return (
          <RxMyAccountPage {...child.props} session={props.session}>
            {child.props.children}
          </RxMyAccountPage>
        );
      }
      if (child.props?.className?.split(' ').includes('my-brokerage-wrapper')) {
        const [brokerage] = (props.session?.brokerages as unknown as BrokerageDataModel[]) || [];
        return (
          <BrokerageInformationForm {...child.props} data={brokerage} session={props.session}>
            {child.props.children}
          </BrokerageInformationForm>
        );
      }
      if (child.props?.className?.split(' ').includes('brand-prefs')) {
        return (
          <RxBrandPreferences {...child.props} session={props.session}>
            {child.props.children}
          </RxBrandPreferences>
        );
      }
      if (child.props?.className?.indexOf('cta-save-account') >= 0) {
        if (child.type === 'a') {
          return (
            <RxButton {...child.props} type='button' id={`${Events.UpdateBrandPreferences}-trigger`} rx-event={Events.UpdateBrandPreferences}>
              {child.props.children}
            </RxButton>
          );
        }
      } else if (child.props?.className?.split(' ').includes('plan-title')) {
        if (props.session?.subscription) {
          const subscription = props.session.subscription as unknown as {
            name: string;
            interval: 'monthly' | 'yearly';
          };
          return <RxKeyValueRow {...child.props} value={subscription.name} />;
        }
        return <RxKeyValueRow {...child.props} />;
      }

      // TODO
      // if (child.props?.className?.split(' ').includes('my-brokerage-wrapper')) {
      //   return <RxBrokerageInformation {...child.props}>{child.props.children}</RxBrokerageInformation>;
      // }
      return React.cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          // Wrap grandchildren too
          children: <RxPageIterator {...props}>{child.props.children}</RxPageIterator>,
        },
      );
    } else return child;
  });

  return <>{wrappedChildren}</>;
}
