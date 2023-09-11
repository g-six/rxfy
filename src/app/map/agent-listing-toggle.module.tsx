'use client';

import React from 'react';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events } from '@/hooks/useEvent';

import styles from './agent-listing-toggle.module.scss';

function Iterator({ agent, children, ...props }: { agent: AgentData; children: React.ReactElement; show?: boolean }) {
  const Wrapped = React.Children.map(children, c => {
    if (typeof c.props?.children === 'string') {
      return React.cloneElement(c, c.props, [c.props.children.split('{Agent Name}').join(agent.full_name)]);
    } else if (c.type === 'div') {
      // if (c.props.className.includes('toggle-base')) {
      //   return React.cloneElement(
      //     c,
      //     {
      //       className: classNames(c.props.className, styles.toggle, props.show ? styles.active : styles.inactive),
      //     },
      //     <div className={classNames(c.props.children.props.className, props.show ? styles.active_circle : styles.inactive_circle)} />,
      //   );
      // }
      return React.cloneElement(
        c,
        c.props,
        <Iterator {...props} agent={agent}>
          {c.props.children}
        </Iterator>,
      );
    }
  });
  return <>{Wrapped}</>;
}

export default function AgentListingsToggle({ className, children, agent }: { className: string; children: React.ReactElement; agent: AgentData }) {
  const { data, fireEvent: toggleAgentOnly } = useEvent(Events.AgentMyListings);
  return (
    <div
      className={classNames(className, 'rexified', 'AgentListingsToggle')}
      onClick={() => {
        toggleAgentOnly({ show: !data?.show });
      }}
    >
      <Iterator agent={agent} {...data}>
        {children}
      </Iterator>
    </div>
  );
}
