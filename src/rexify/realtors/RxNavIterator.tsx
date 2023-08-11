import { AgentData } from '@/_typings/agent';
import RxSessionDropdown from '@/components/Nav/RxSessionDropdown';
import React from 'react';
type Props = {
  className?: string;
  data?: { [key: string]: string | number };
  session?: { [key: string]: string | number };
  children: JSX.Element;
};

export function RxNavIterator(p: Props) {
  return (
    <>
      {React.Children.map(p.children, child => {
        if (child.props?.children) {
          const className = (child.props.className ? child.props.className + ' ' : '') + 'rexified';
          if (className.split(' ').includes('in-session-dropdown'))
            return <RxSessionDropdown agent={p.session as unknown as AgentData}>{child.props?.children}</RxSessionDropdown>;
          return React.cloneElement(child, {
            className,
            children: (
              <RxNavIterator {...child.props} session={p.session} className={className}>
                {className.split(' ').includes('agent-name') ? p.session?.full_name : child.props.children}
              </RxNavIterator>
            ),
          });
        }
        return child;
      })}
    </>
  );
}

export function buildNavigationComponent(children: React.ReactElement[], container_props: Props) {
  const [wrapper] = children
    .filter(f => f.props.className.includes('navigation-full-wrapper'))
    .map(({ props }) => {
      return (
        <div key='navigation-full-wrapper-2' id={props.id || 'rx-navigation'} className={[props.className || '', 'rexified'].join(' ')}>
          {React.Children.map(props.children, child => (
            <RxNavIterator {...child.props} {...container_props}>
              {child}
            </RxNavIterator>
          ))}
        </div>
      );
    });

  return wrapper || <></>;
}
