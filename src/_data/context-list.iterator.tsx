import { Children, ReactElement, cloneElement } from 'react';
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
  const rexified = Children.map(children, async (c, idx) => {
    if (c.props) {
      const { className, ...attribs } = c.props;
      if (props.data) {
        if (attribs['data-component'] && props['data-context']) {
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
            return <DataComponentGroupItem {...attribs} component={c} data={dataset[idx]} data-sources={props.data} />;
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
              value,
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
          return cloneElement(c, {}, <ContextListIterator {...props}>{attribs.children}</ContextListIterator>);
        }
      }
    }
    return c;
  });

  return <>{rexified}</>;
}
