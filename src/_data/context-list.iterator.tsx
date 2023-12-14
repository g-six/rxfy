import { Children, ReactElement, cloneElement } from 'react';
import DataAction from './data-action';
import DataComponentGroupItem from './data-component.group';

interface Props {
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}

export default async function ContextListIterator({
  children,
  ...props
}: {
  children: ReactElement;
  'data-context'?: string;
  'data-filter'?: string;
  dataset: { [k: string]: unknown }[];
} & Props) {
  return <Iterator {...props}>{children}</Iterator>;
}
function Iterator({
  children,
  ...props
}: {
  children: ReactElement;
  'data-context'?: string;
  'data-filter'?: string;
  dataset: { [k: string]: unknown }[];
} & Props) {
  const rexified = Children.map(children, (c, idx) => {
    if (c.props) {
      const { className, ...attribs } = c.props;
      if (props.data) {
        if (props['data-context']) {
          let dataset: { [k: string]: unknown }[] = [];
          if (props['data-filter']) {
            const { [props['data-filter']]: d } = props.data[props['data-context']] as {
              [k: string]: { [k: string]: unknown }[];
            };
            dataset = d;
          } else {
            dataset = [
              props.data[props['data-context']] as {
                [k: string]: unknown;
              },
            ];
          }
          if (dataset[idx]) {
            if (attribs['data-component']) return <DataComponentGroupItem {...attribs} component={c} data={dataset[idx]} data-sources={props.data} />;
            else if (attribs['data-action']) {
              return (
                <DataAction {...attribs} {...props} context-data={dataset[idx]}>
                  {c}
                </DataAction>
              );
            }
          }
        }
        let field = '';
        if (attribs['data-field']) {
          field = attribs['data-field'];
          if (field === 'address') field = 'title';
        }
        if (attribs['data-image']) {
          field = attribs['data-image'];
        }

        if (field) {
          let value = '';

          if (props.dataset.length && !attribs['data-context']) {
            value = (props.dataset[0][field] as string) || value;
            if (attribs['data-image']) {
              return cloneElement(c, {
                className,
                src: value,
              });
            }
            return cloneElement(
              c,
              {
                className,
              },
              value || c.props.children,
            );
          }

          if (attribs['data-context'] && props.data) {
            const data = props.data[attribs['data-context']] as {
              [k: string]: string;
            };
            return cloneElement(
              c,
              {
                className,
              },
              data[field],
            );
          }
        }

        if (attribs.children && typeof attribs.children !== 'string') {
          return cloneElement(c, {}, <Iterator {...props}>{attribs.children}</Iterator>);
        }
      }
    }
    return c;
  });

  return <>{rexified}</>;
}
