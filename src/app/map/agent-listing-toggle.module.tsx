import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import React from 'react';

function Iterator({ agent, children, ...props }: { agent: AgentData; children: React.ReactElement }) {
  const Wrapped = React.Children.map(children, c => {
    if (typeof c.props?.children === 'string') {
      return React.cloneElement(c, c.props, [c.props.children.split('{Agent Name}').join(agent.full_name)]);
    } else if (c.type === 'div') {
      if (c.props.className.includes('toggle-base')) {
        return c;
      }
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
  return (
    <div className={classNames(className, 'rexified', 'AgentListingsToggle')}>
      <Iterator agent={agent}>{children}</Iterator>
    </div>
  );
}
