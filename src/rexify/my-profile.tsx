'use client';
import { BrokerageInputModel, RealtorInputModel } from '@/_typings/agent';
// import { RxBrokerageInformation } from '@/components/RxForms/RxBrokerageInformation';
import { RxMyAccountPage } from '@/components/full-pages/RxMyAccountPage';
import Script from 'next/script';
import React from 'react';
interface DataModel extends RealtorInputModel {
  session_key?: string;
}
type Props = {
  data: DataModel;
  children: JSX.Element;
};

export default function MyProfilePage(p: Props) {
  let navigation_wrapper;
  let dash_area;

  let html_props: { [key: string]: string } = {};
  const scripts: { [key: string]: string }[] = [];

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
                navigation_wrapper = buildNavigationComponent(div.props.children);
                dash_area = buildMainComponent(div.props.children, p.data);
                // account_info_panel = buildAccountInfoPanel(div.props.children)
                // React.Children.map(div.props.children, (div: React.ReactElement, idx: number) => {
                //     console.log()
                // })
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

function buildMainComponent(children: React.ReactElement[], data?: DataModel) {
  const [wrapper] = children
    .filter(f => f.props.className.split(' ').includes('dash-area'))
    .map(({ props }) => {
      return (
        <div key='dash-area' className={[props.className, 'rexified'].join(' ')}>
          <RxPageIterator data={data || {}}>{props.children}</RxPageIterator>
        </div>
      );
    });

  return wrapper || <></>;
}

export function RxPageIterator(props: Props) {
  const wrappedChildren = React.Children.map(props.children, child => {
    if (child.props && child.props.children) {
      if (child.props?.className?.split(' ').includes('my-account-wrapper')) {
        return (
          <RxMyAccountPage {...child.props} data={props.data}>
            {child.props.children}
          </RxMyAccountPage>
        );
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
