import { Children, ReactElement, cloneElement } from 'react';
import DataFieldAtom from './data-field.atom';
import ContextListIterator from './context-list.iterator';
import FormComponent from './client-components/form.client-component';
import DataShowOn from './data-show.client-component';
import { consoler } from '@/_helpers/consoler';

interface Props {
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}

const FILE = 'data-context.tsx';

function ContextIterator({ children, ...props }: { children: ReactElement } & Props) {
  const rexifier = Children.map(children, c => {
    if (c.props && props.data) {
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        let className = attribs.className || '';

        if (attribs['data-show-on']) {
          return <DataShowOn {...attribs} element={c} />;
        }
        const data_context = attribs['data-context'];
        if (attribs['data-context'] || c.type === 'form') {
          className = className ? `${className} rexified` : 'rexified';
          // if data of context already fetched
          if (props.data[data_context] && c.type !== 'form') {
            // Filter presence tells us that the context contains multiple records
            // and should be laid out in a grid or list wrapper that requires a loop
            // to iterate over the records. eg. list of recent listings
            const filter = attribs['data-filter'];
            if (filter) {
              const { [filter]: dataset } = props.data[data_context] as unknown as {
                [k: string]: unknown[];
              };
              if (dataset?.length) {
                return cloneElement(
                  c,
                  {
                    className,
                    'data-context': data_context,
                    'fallback-context': props['fallback-context'],
                    'data-filter': filter,
                  },
                  <ContextListIterator {...props} dataset={dataset} data={props.data} {...attribs}>
                    {sub}
                  </ContextListIterator>,
                );
              }
            }
          } else if (c.type === 'form') {
            // Form rexify step
            return (
              <FormComponent {...attribs} {...props} className={className} data-context={data_context}>
                {sub}
              </FormComponent>
            );
          }
        } else if (attribs['data-filter']) {
          const filter = attribs['data-filter'];
          const { [filter]: dataset } = props.data[attribs['data-context'] || props['fallback-context']] as {
            [k: string]: { [k: string]: unknown };
          };

          if (dataset?.length) {
            return cloneElement(
              c,
              {
                className,
                'data-rexifier': FILE,
                'data-context': attribs['data-context'],
              },
              <ContextListIterator {...props} dataset={dataset} data={props.data} {...attribs}>
                {sub}
              </ContextListIterator>,
            );
          }
        }

        return cloneElement(
          c,
          {
            className,
            'data-rexifier': FILE,
            'data-context': attribs['data-context'] || data_context,
          },
          <ContextIterator {...props}>{sub}</ContextIterator>,
        );
      } else if (c.props['data-field'] || c.props['data-fields'] || c.props['data-image'] || c.props['data-input']) {
        const atomic_parameters: {
          data?: { [k: string]: unknown };
          contexts: { [k: string]: { [k: string]: unknown } };
          'data-context': string;
          'fallback-context': string;
        } = {
          ...props,
          'data-context': c.props['data-context'] || props['fallback-context'],
        };
        return <DataFieldAtom {...atomic_parameters}>{c}</DataFieldAtom>;
      } else if (c.props['data-component'] == 'mapbox') {
        const geocoding_field = c.props[`data-${c.props['data-component']}-json`];
        const geo_context = c.props['data-context'] || props['fallback-context'] || '';
        if (geocoding_field && props.data[geo_context]) {
          const { [geocoding_field]: geocoding } = props.data[geo_context] as {
            [k: string]: {
              lat: number;
              lng: number;
            };
          };
          const { map } = props.data[geo_context] as {
            map: string;
          };
          if (map) {
            return cloneElement(c, { src: map, srcSet: undefined });
          }
        }
      }

      return cloneElement(c, {
        'data-rexifier': FILE,
      });
    }
    return c;
  });
  return <>{rexifier}</>;
}

export default async function DataContext({
  children,
  ...props
}: {
  children: ReactElement;
} & Props) {
  return (
    <>
      <ContextIterator {...props}>{children}</ContextIterator>
    </>
  );
}
