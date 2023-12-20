import { consoler } from '@/_helpers/consoler';
import { Children, ReactElement, cloneElement } from 'react';
import DataFieldGroup from './data-field.group';
import { formatValues } from '@/_utilities/data-helpers/property-page';

const FILE = 'data-component.group.tsx';

async function ComponentIterator({
  children,
  ...props
}: {
  children: ReactElement;
  'data-sources': { [k: string]: { [k: string]: unknown } };
  data?: { [k: string]: unknown };
}) {
  const rexifier = Children.map(children, c => {
    const { data } = props;
    if (c.props) {
      const { children: sub, ...attribs } = c.props;
      let className = attribs.className || '';

      if (data) {
        let field = attribs['data-field'] || '';
        if (attribs['data-image']) field = attribs['data-image'];
        if (field) {
          className = className ? `${className} rexified` : 'rexified';
          if (field === 'address') {
            field = 'title';
          }
          let value = data[field] as string;

          if (field === 'cover_photo' && data.photos) {
            value = (data.photos as string[]).reverse().pop() as string;
          }

          if (!value) {
            const source = props['data-sources'][attribs['data-context']];
            value = attribs['data-context'] ? source[field] : field;
          }

          if (c.type === 'img') {
            return cloneElement(c, {
              src: value,
              'data-rexifier': FILE,
            });
          }
          if (c.type === 'svg') {
            return cloneElement(<img />, {
              src: value,
              'data-rexifier': FILE,
            });
          }

          if (attribs['data-display-as'] === 'currency' && !isNaN(Number(value))) {
            value = '$' + new Intl.NumberFormat(undefined, {}).format(Number(value));
          }

          return cloneElement(
            c,
            {
              className,
              'data-rexifier': FILE,
            },
            value,
          );
        }

        let group = attribs['data-field-group'] || '';
        if (group && props.data) {
          return (
            <DataFieldGroup {...props} data={props.data} data-field-group={group}>
              {c}
            </DataFieldGroup>
          );
        }
      }

      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          {
            className,
            'data-rexifier': FILE,
          },
          <ComponentIterator {...props}>{sub}</ComponentIterator>,
        );
      }

      return cloneElement(c, {
        'data-rexifier': FILE,
      });
    }
  });
  return <>{rexifier}</>;
}

export default async function DataComponentGroupItem({
  component,
  data,
  ...props
}: {
  component: ReactElement;
  'data-sources': {
    [k: string]: {
      [k: string]: unknown;
    };
  };
  data: { [k: string]: unknown };
}) {
  return (
    <ComponentIterator {...props} data={data}>
      {component}
    </ComponentIterator>
  );
}
