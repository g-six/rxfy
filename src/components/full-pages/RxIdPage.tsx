import React from 'react';
import { AgentData } from '@/_typings/agent';
import { hasClassName } from '@/_utilities/html-helper';
import RxShareButton from '../RxShareButton';

type Props = {
  className: string;
  agent: AgentData;
  children: React.ReactElement[];
};

const message = `Hi there! I was looking for realtors in my area of interest and found your listings on Leagent...`;

function PageIterator(props: Props) {
  const wrappedChildren = React.Children.map(props.children, child => {
    if (child.props) {
      const childClassName = child.props.className || '';
      if (hasClassName(childClassName, 'id-image-block')) {
        return React.cloneElement(
          {
            ...child,
          },
          {
            ...child.props,
            className: `${childClassName}`,
            style: {
              backgroundImage: `url(${
                props.agent.metatags?.profile_image || 'https://t5d9a2n4.stackpathcdn.com/wp-content/uploads/2022/05/omara-subzwari.jpg'
              })`,
            },
            // Wrap grandchildren too
            children: <PageIterator {...props}>{child.props.children}</PageIterator>,
          },
        );
      } else if (hasClassName(childClassName, 'save-contact')) {
        return (
          <a {...child.props} href={`https://pages.leagent.com/${props.agent.domain_name}/contact.vcf`}>
            {child.props.children}
          </a>
        );
      } else if (hasClassName(childClassName, 'call-button')) {
        return React.cloneElement(<a />, {
          ...child.props,
          className: `${childClassName}`,
          // Wrap grandchildren too
          children: <PageIterator {...props}>{child.props.children}</PageIterator>,
          href: `tel:${props.agent.phone}`,
        });
      } else if (hasClassName(childClassName, 'share-contact')) {
        return React.cloneElement(<RxShareButton title={props.agent.full_name} className={child.props?.className || ''} />, {
          ...child.props.children.props,
          children: `${child.props.children.props.children}`.split('{Agent}').join(props.agent.full_name),
        });
      } else if (hasClassName(childClassName, 'idbutton') && hasClassName(childClassName, 'button-primary')) {
        return (
          <a {...child.props} href={`sms:${props.agent.phone}?&body=${encodeURIComponent(message)}`}>
            {child.props.children}
          </a>
        );
      } else if (child.props.children?.length > 1) {
        return React.cloneElement(
          {
            ...child,
          },
          {
            ...child.props,
            // Wrap grandchildren too
            children: <PageIterator {...props}>{child.props.children}</PageIterator>,
          },
        );
      } else if (typeof child.props.children !== 'string') {
        return React.cloneElement(
          {
            ...child,
          },
          {
            ...child.props,
            // Wrap grandchildren too
            children: <PageIterator {...props}>{child.props.children}</PageIterator>,
          },
        );
      }
    } else if (typeof child === 'string') {
      switch (child) {
        case '{Agent Name}':
          return props.agent.full_name;
        case '{Brokerage Name}':
          return props.agent.metatags?.brokerage_name || '';
        case '{Agent Phone Number}':
          return props.agent.phone || '';
        case '{Agent Email}':
          return props.agent.email || '';
      }
      return `${child}`.split('{Agent}').join(props.agent.full_name);
    }
    return child;
  });

  return <>{wrappedChildren}</>;
}

export default function RxIdPage(p: Props) {
  return (
    <div className={`rexified ${p.className}`}>
      <PageIterator {...p}>{p.children}</PageIterator>
    </div>
  );
}