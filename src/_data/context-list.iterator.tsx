import { Children, ReactElement, cloneElement } from 'react';
import DataAction from './data-action';
import DataComponentGroupItem from './data-component.group';
import DataFieldGroup from './data-field.group';
import DataFieldAtom from './data-field.atom';
import { consoler } from '@/_helpers/consoler';
import { objectToQueryString } from '@/_utilities/url-helper';

interface Props {
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}

const FILE = 'context-list.iterator.tsx';

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
        if (attribs['data-json'] && props.dataset.length) {
          const parameters: string[] = attribs['data-json'].split('|');
          if (props.dataset[idx]) {
            const obj = props.dataset[idx] as unknown as { [k: string]: string };
            let params: { [k: string]: string } = {};
            Object.keys(obj).map(k => {
              if (parameters.includes(k)) {
                params = {
                  ...params,
                  [k]: obj[k],
                };
              }
            });

            return cloneElement(
              c,
              {
                href: c.type === 'a' ? c.props.href + '?' + objectToQueryString(params) : undefined,
                'data-rexifier': FILE,
              },
              <DataFieldAtom {...props} data={props.dataset[idx]} data-context={attribs['data-context'] || props['data-context'] || props['fallback-context']}>
                {c.props.children}
              </DataFieldAtom>,
            );
          }
          return <></>;
        }

        if (attribs['data-component'] && props['data-filter'] === attribs['data-component']) {
          if (props.dataset.length === 0 && attribs['data-empty-text']) {
            return cloneElement(c, {}, attribs['data-empty-text']);
          } else if (!attribs['data-empty-text'])
            return props.dataset.map((record, record_position) => {
              return cloneElement(
                c,
                { key: `${attribs['data-component']}-${record_position + 1}-${new Date()}`, 'data-index': record_position },
                <DataFieldAtom {...props} data={record}>
                  {c.props.children}
                </DataFieldAtom>,
              );
            });
        }
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
          if (attribs['data-component'] && dataset[idx]) {
            return <DataComponentGroupItem {...attribs} component={c} data={dataset[idx]} data-sources={props.data} />;
          }

          // Rexify action components for only one (first) record
          if (dataset[0] && attribs['data-action']) {
            return (
              <DataAction {...attribs} {...props} context-data={dataset[0]}>
                {c}
              </DataAction>
            );
          }
          // Rexify grouped components for only one (first) record
          // if (dataset[0] && attribs['data-group']) {
          //   console.log(FILE, dataset[idx].mls_id, dataset[idx].title);
          //   return <DataComponentGroupItem {...attribs} component={c} data={dataset[0]} data-sources={props.data} />;
          // }
          if (dataset[0] && attribs['data-field-group']) {
            return cloneElement(
              c,
              {
                'data-rexifier': FILE,
              },
              <DataFieldGroup
                data-field-group={attribs['data-field-group']}
                data-json-ref={attribs['data-json-ref']}
                data={dataset[0]}
                data-sources={props.data}
              >
                {attribs.children}
              </DataFieldGroup>,
            );
          }
        }
        let field = '';
        if (attribs['data-field']) {
          field = attribs['data-field'];
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
                'data-rexifier': FILE,
              });
            }
            return cloneElement(
              c,
              {
                className,
                'data-rexifier': FILE,
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
                'data-rexifier': FILE,
              },
              data[field],
            );
          }
        }

        if (attribs.children && typeof attribs.children !== 'string') {
          return cloneElement(
            c,
            {
              'data-rexifier': FILE,
            },
            <Iterator {...props}>{attribs.children}</Iterator>,
          );
        }
      }
    }
    return c;
  });

  return <>{rexified}</>;
}
