import { consoler } from '@/_helpers/consoler';
import { Children, ReactElement, cloneElement } from 'react';
import DataInputAtom from './data-input';
import DataAction from './data-action';
import { cookies } from 'next/headers';
import DataShowOn from './data-show.client-component';

async function AtomIterator({
  children,
  data,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
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
            if (data.photos) {
              value = (data.photos as string[]).reverse().pop() as string;
            }
          }

          if (!value) {
            const { [field]: v } = data[props['fallback-context']] as { [k: string]: string };
            value = v;
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

        // Input
        if (attribs['data-input'] && attribs['data-form']) {
          return (
            <DataInputAtom {...props} data={data} data-form={attribs['data-form']}>
              {c}
            </DataInputAtom>
          );
        }
        if (attribs['data-show-on']) {
          const show_on = attribs['data-show-on'] as string;
          return <DataShowOn {...attribs} element={c} />;
        }
        if (attribs['data-action']) {
          return (
            <DataAction {...attribs} {...props} data={data}>
              {c}
            </DataAction>
          );
        }
      }

      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          {
            className,
          },
          <AtomIterator data={data} {...props}>
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
  'data-context': string;
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}) {
  return <AtomIterator {...props}>{children}</AtomIterator>;
}
