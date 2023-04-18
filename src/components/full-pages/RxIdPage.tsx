import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { AgentData } from '@/_typings/agent';
import { classNames, hasClassName } from '@/_utilities/html-helper';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import React from 'react';

type Props = {
  className: string;
  agent: AgentData;
  children: React.ReactElement[];
};

const message = `Hi there! I was looking for realtors in my area of interest and found your listings on Leagent...`;

function createVCF(agent: AgentData) {
  return `BEGIN:VCARD\nVERSION:4.0\nN:${agent.full_name};;\nFN:${agent.full_name}\nORG:${
    agent.metatags?.brokerage_name || agent.full_name
  }\nTITLE:Leagent Realtor\nTEL;TYPE=WORK,VOICE:${agent.phone}\nEMAIL;TYPE=PREF,INTERNET:${agent.email}\nEND:VCARD`;
}

function PageIterator(props: Props) {
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;
    if (child.props) {
      if (hasClassName(child.props.className, 'call-button')) {
        return (
          <a {...child.props} href={`tel:${props.agent.phone}`}>
            {child.props.children}
          </a>
        );
      } else if (hasClassName(child.props.className, 'idbutton') && hasClassName(child.props.className, 'button-primary')) {
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
