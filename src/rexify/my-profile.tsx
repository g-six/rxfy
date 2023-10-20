'use client';
import RxKeyValueRow from '@/components/RxProperty/RxKeyValueRow';
import { RxMyAccountPage } from '@/components/full-pages/RxMyAccountPage';
import Script from 'next/script';
import React from 'react';
import RxLeftMenuTab from './realtors/RxLeftMenuTab';
import useEvent, { Events } from '@/hooks/useEvent';
import { BrokerageInformationForm } from './realtors/brokerage-information';
import { BrokerageDataModel } from '@/_typings/brokerage';
import RxBrandPreferences from './realtors/brand-preferences';
import { RxButton } from '@/components/RxButton';
import { buildNavigationComponent } from './realtors/RxNavIterator';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import styles from './my-profile.module.scss';

type Props = {
  className?: string;
  data?: { [key: string]: string | number };
  session?: { [key: string]: string | number };
  children: JSX.Element;
};

export default function MyProfilePage(p: Props) {
  const { data } = useEvent(Events.LoadUserSession);
  const scripts: { [key: string]: string }[] = [];
  const [dash_area, setDashArea] = React.useState<React.ReactElement>();
  const [navigation_wrapper, setNavBar] = React.useState<React.ReactElement>();
  React.useEffect(() => {
    const session = data as unknown as { [key: string]: string | number };
    if (session?.id) {
      console.log(JSON.stringify(p.children));
      if (p.children.type === 'html') {
        Object.keys(p.children.props).forEach((key: string) => {
          if (key === 'children') {
            p.children.props[key].forEach((child: React.ReactElement) => {
              if (child.type === 'body') {
                child.props.children.forEach((div: React.ReactElement) => {
                  if (div.type === 'div') {
                    setDashArea(buildMainComponent(div.props.children, { ...p, session }));
                  }
                });
              }
            });
          }
        });
      }
    }
  }, [data]);

  React.useEffect(() => {
    if (p.children.type === 'html') {
      Object.keys(p.children.props).forEach((key: string) => {
        if (key === 'children') {
          p.children.props[key].forEach((child: React.ReactElement) => {
            if (child.type === 'body') {
              child.props.children.forEach((div: React.ReactElement) => {
                if (div.type === 'div') {
                  setNavBar(buildNavigationComponent(div.props.children, { ...p, session: data as unknown as { [key: string]: string | number } }));
                  // setDashArea(buildMainComponent(div.props.children, { ...p, session }));
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
    }
  }, []);

  return (
    <>
      <div className='dash-wrapper rexified'>
        {navigation_wrapper}
        {dash_area}
      </div>
      {scripts.map(({ src, type }) => (
        <Script key={src.split('/').pop()} src={src} type={type} />
      ))}
    </>
  );
}

function buildMainComponent(children: React.ReactElement[], container_props: Props) {
  const [wrapper] = children
    .filter(f => f.props.className.split(' ').includes('dash-area'))
    .map(({ props }) => {
      return (
        <div key='dash-area' className={[props.className, 'rexified'].join(' ')}>
          <RxPageIterator className={props.className.split('dash-area').join(' ').trim()} session={container_props.session}>
            {props.children}
          </RxPageIterator>
        </div>
      );
    });

  return wrapper || <></>;
}

export function RxPageIterator(props: Props) {
  const wrappedChildren = React.Children.map(props.children, child => {
    if (child.props && child.props.children) {
      if (child.props?.className?.split(' ').includes('dash-tabs')) {
        return React.cloneElement(child, {
          children: React.Children.map(child.props.children, RxLeftMenuTab),
        });
      }
      if (child.props?.className?.split(' ').includes(WEBFLOW_NODE_SELECTOR.MY_ACCOUNT_WRAPPER)) {
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
      } else if (child.props?.className?.split(' ').includes('faq-item-basic')) {
        return React.cloneElement(child, {
          onClick: (evt: React.SyntheticEvent<HTMLDivElement>) => {
            document.querySelector('.faq-item-basic.' + styles.active + ' nav')?.setAttribute('style', 'height: 0px;');
            document.querySelector('.faq-item-basic.' + styles.active + ' nav')?.classList.remove('w--open');
            document.querySelector('.faq-item-basic.' + styles.active)?.classList.remove(styles.active);
            if (evt.currentTarget.classList.contains(styles.active)) {
              evt.currentTarget.querySelector('nav')?.setAttribute('style', 'height: 0px');
              evt.currentTarget.classList.remove(styles.active);
            } else {
              evt.currentTarget.classList.add(styles.active);
              evt.currentTarget.querySelector('nav')?.setAttribute('style', 'height: 100%');
              evt.currentTarget.querySelector('nav')?.classList.add('w--open');
            }
          },
        });
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
