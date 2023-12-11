'use client';

import { Children, ReactElement, cloneElement, useState } from 'react';
import { classNames } from '@/_utilities/html-helper';

type Props = {
  children: ReactElement;
};
function Rexifier({ children, ...attr }: Props & { toggle(): void; 'data-toggle'?: boolean }) {
  const rexified = Children.map(children, c => {
    if (c.props && c.type !== 'svg') {
      const { children: sub, ...props } = c.props;

      if (c.props.children && typeof sub !== 'string') {
        if (props?.className?.includes('dropdown-toggle')) {
          return cloneElement(c, {
            onClick: () => {
              attr.toggle();
            },
          });
        }
        if (props?.className?.includes('dropdown-list')) {
          return (
            <p className={props.className + (attr['data-toggle'] ? '' : ' h-0')} onClick={() => attr.toggle()}>
              {sub}
            </p>
          );
        }
        return cloneElement(
          c,
          {
            className: classNames(props.className || '', 'tab-subscription.rexifier'),
          },
          <Rexifier {...attr}>{sub}</Rexifier>,
        );
      }
    }
    return c;
  });
  return <>{rexified}</>;
}
export default function Accordion({ children, className }: { className?: string; children: ReactElement }) {
  const [is_opened, toggle] = useState(false);
  return (
    <div className={className} data-component-rexifier='accordion' data-client-component>
      <Rexifier data-toggle={is_opened} toggle={() => toggle(!is_opened)}>
        {children}
      </Rexifier>
    </div>
  );
}
