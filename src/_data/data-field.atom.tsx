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
      const { children: sub, ...attribs } = c.props;
      let className = attribs.className || '';
      className = className ? `${className} rexified` : 'rexified';

      if (data) {
        let field = attribs['data-field'] || '';
        if (attribs['data-image']) field = attribs['data-image'];
        if (field) {
          if (field === 'address') {
            field = 'title';
          }
          let value = data[field] as string;

          if (field === 'cover_photo') {
            console.log({ value });
            value = (data.photos as string[]).reverse().pop() as string;
          }

          if (!value && props['base-context']) {
            value = props['base-context'][field] as string;
          }

          if (c.type === 'img') {
            return cloneElement(c, {
              src: value,
            });
          }
          if (c.type === 'svg') {
            return cloneElement(<img />, {
              src: value,
            });
          }
          return cloneElement(
            c,
            {
              className,
            },
            value,
          );
        }
      }

      if (c.props.children && typeof c.props.children !== 'string') {
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
