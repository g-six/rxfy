'use client';

import { Children, MouseEvent, ReactElement, cloneElement, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import TabAccountInfo from './tab-account-info.rexifier';
import TabBrokerageInformation from './tab-brokerage-information.rexifier';
import TabBrandPreferences from './tab-brand-preferences.rexifier';
import TabSocialLinks from './tab-social-links.rexifier';

function Iterate({
  children,
  ...props
}: {
  active: string;
  children: ReactElement;
  agent: AgentData & { phone_number: string };
  onTabClick(evt: MouseEvent<HTMLDivElement>): void;
  onContentUpdate(updates: AgentData & { phone_number: string }): void;
}) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      const { active, onTabClick } = props;
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        if (attribs['data-w-tab']) {
          let className = `${attribs.className}`
            .split(' ')
            .filter(class_name => !['w--current', 'w--tab-active'].includes(class_name))
            .join(' ');
          // If it's a tab button
          let active_component = 'w--tab-active';
          let panel = sub;
          if (attribs.className.includes('tab-link')) {
            active_component = 'w--current';
          } else {
            if (active === 'Account Info') panel = <TabAccountInfo {...props}>{sub}</TabAccountInfo>;
            if (active === 'Brokerage Information') panel = <TabBrokerageInformation {...props}>{sub}</TabBrokerageInformation>;
            if (active === 'Brand Preferences') panel = <TabBrandPreferences {...props}>{sub}</TabBrandPreferences>;
            if (active === 'Social Links') panel = <TabSocialLinks {...props}>{sub}</TabSocialLinks>;
          }
          return cloneElement(
            c,
            {
              ...(attribs.className.includes('tab-link') ? { onClick: onTabClick } : {}),
              className: classNames(className, attribs['data-w-tab'] === active ? active_component : 'not-current'),
            },
            panel,
          );
        }
        return cloneElement(c, {}, <Iterate {...props}>{sub}</Iterate>);
      }
    }
    return c;
  });
  return <>{rexified}</>;
}
export function Rexify({ children, agent, ...props }: { agent: AgentData & { phone_number: string }; children: ReactElement }) {
  const [agent_data, setAgent] = useState<AgentData & { phone_number: string }>(agent);
  const [active, activateTab] = useState('Account Info');

  return (
    <Iterate
      {...props}
      agent={agent_data}
      active={active}
      onContentUpdate={(updates: AgentData & { phone_number: string }) => {
        setAgent(updates);
      }}
      onTabClick={evt => {
        const name = evt.currentTarget.getAttribute('data-w-tab') as string;
        activateTab(name || 'Account Info');
      }}
    >
      {children}
    </Iterate>
  );
}
