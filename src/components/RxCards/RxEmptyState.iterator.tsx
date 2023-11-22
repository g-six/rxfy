import { AgentData } from '@/_typings/agent';
import { Children, ReactElement, cloneElement } from 'react';

interface Props {
  children: ReactElement;
  className?: string;
  agent: AgentData;
  data?: unknown;
}

function Iterator(p: Props) {
  const { children, className, ...props } = p;
  const rexified = Children.map(children, c => {
    if (c.props?.children) {
      const { 'data-action': do_on_click } = c.props;
      if (do_on_click === 'find_homes') {
        return <></>;
      }
      if (typeof c.props.children !== 'string') {
        return cloneElement(c, {}, <Iterator {...props}>{c.props.children}</Iterator>);
      }
    }
    return c;
  });

  return <>{rexified}</>;
}

export function RxEmptyState(p: Props) {
  const { agent, data, children, ...props } = p;

  return (
    <div {...props} data-rx='components.RxCards.RxEmptyState'>
      <Iterator {...props} agent={agent} data={data}>
        {children}
      </Iterator>
    </div>
  );
}
