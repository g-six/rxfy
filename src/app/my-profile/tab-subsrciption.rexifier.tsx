import Accordion from '@/_rexifiers/accordion-rexifier.client-component';
import { classNames } from '@/_utilities/html-helper';
import { Children, ReactElement, cloneElement } from 'react';

type Props = {
  children: ReactElement;
  className?: string;
};

function Rexifier({ children }: Props) {
  const rexified = Children.map(children, c => {
    if (c.props && c.type !== 'svg') {
      const { children: sub, ...props } = c.props;
      if (sub && typeof sub !== 'string') {
        if (props.className?.includes('faq-item-basic')) {
          return <Accordion className={props.className}>{sub}</Accordion>;
        }
        return cloneElement(
          c,
          {
            className: classNames(props.className || '', 'tab-subscription.rexifier'),
          },
          <Rexifier>{sub}</Rexifier>,
        );
      }
    }
    return c;
  });
  return <>{rexified}</>;
}
export default function TabSubscription(c: Props) {
  const { children, className } = c;
  return (
    <section className={className}>
      <Rexifier>{children}</Rexifier>
    </section>
  );
}
