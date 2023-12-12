import { consoler } from '@/_helpers/consoler';
import { Children, ReactElement, cloneElement } from 'react';

async function AtomIterator({
  children,
  data,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  'base-context': { [k: string]: unknown };
}) {
  const rexifier = Children.map(children, c => {
    if (c.props) {
      if (c.props.children) {
        const { children: sub, ...attribs } = c.props;
        let className = attribs.className || '';
        className = className ? `${className} rexified` : 'rexified';

        if (attribs['data-field'] && data) {
          let field = attribs['data-field'];
          if (field === 'address') {
            field = 'title';
          }
          let value = data[field] as string;
          if (!value && props['base-context']) {
            value = props['base-context'][field] as string;
          }
          return cloneElement(
            c,
            {
              className,
            },
            value,
          );
        }

        if (typeof c.props.children !== 'string') {
          return cloneElement(
            c,
            {
              className,
            },
            <AtomIterator data={data} base-context={props['base-context']}>
              {sub}
            </AtomIterator>,
          );
        }
      }
      return c;
    }
  });
  return <>{rexifier}</>;
}

export default async function DataFieldAtom({
  children,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  'base-context': { [k: string]: unknown };
}) {
  consoler('data-field.atom.tsx', props['base-context']);
  return <AtomIterator {...props}>{children}</AtomIterator>;
}
