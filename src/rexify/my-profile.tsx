'use client';
import { BrokerageInputModel, RealtorInputModel } from '@/_typings/agent';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import RxKeyValueRow from '@/components/RxProperty/RxKeyValueRow';
// import { RxBrokerageInformation } from '@/components/RxForms/RxBrokerageInformation';
import { RxMyAccountPage } from '@/components/full-pages/RxMyAccountPage';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import React from 'react';
import RxLeftMenuTab from './realtors/RxLeftMenuTab';
import useEvent, { Events } from '@/hooks/useEvent';
interface DataModel extends RealtorInputModel {
  session_key?: string;
  'user-type'?: string;
}
type Props = {
  data: DataModel;
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
      getUserBySessionKey(Cookies.get('session_key') as string, p.data['user-type'] && p.data['user-type'] === 'realtor' ? 'realtor' : undefined)
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
                        setNavBar(buildNavigationComponent(div.props.children));
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

function buildNavigationComponent(children: React.ReactElement[]) {
  const [wrapper] = children
    .filter(f => f.props.className.split(' ').includes('navigation-full-wrapper-2'))
    .map(({ props }) => {
      return (
        <div key='navigation-full-wrapper-2' className={[props.className, 'rexified'].join(' ')}>
          {props.children}
        </div>
      );
    });

  return wrapper || <></>;
}

function buildMainComponent(children: React.ReactElement[], container_props: Props) {
  const [wrapper] = children
    .filter(f => f.props.className.split(' ').includes('dash-area'))
    .map(({ props }) => {
      return (
        <div key='dash-area' className={[props.className, 'rexified'].join(' ')}>
          <RxPageIterator data={container_props.data || {}} session={container_props.session}>
            {props.children}
          </RxPageIterator>
        </div>
      );
    });

  return wrapper || <></>;
}

export function RxPageIterator(props: Props) {
  const { data: active_data } = useEvent(Events.DashboardMenuTab);
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
          <RxMyAccountPage {...child.props} data={props.data} user-type={props.data['user-type']} session={props.session}>
            {child.props.children}
          </RxMyAccountPage>
        );
      }
      if (child.props?.className?.split(' ').includes('plan-title')) {
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
