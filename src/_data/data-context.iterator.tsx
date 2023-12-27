import { Children, ReactElement, cloneElement } from 'react';
import DataFieldAtom from './data-field.atom';
import ContextListIterator from './context-list.iterator';
import FormComponent from './client-components/form.client-component';
import DataShowOn from './data-show.client-component';
import { consoler } from '@/_helpers/consoler';
import DataAction from './data-action';
import DataModal from './data-modal.client-component';
import DataFieldGroup from './data-field.group';
import ContextStatsIterator from './context-stats.iterator';
import { getPropertyIconAndTitle } from '@/app/api/pipeline/subroutines';

const FILE = 'data-context.iterator.tsx';

interface Props {
  data?: { [k: string]: unknown };
  'data-context': string;
  'data-filter'?: string;
  'fallback-context'?: string;
}
export default function ContextIterator({ children, ...props }: { children: ReactElement } & Props) {
  let data_context = props['data-context'];
  if (!data_context && props['fallback-context']) data_context = props['fallback-context'];
  let data_filter = props['data-filter'];

  const rexifier = Children.map(children, c => {
    if (c.props?.['data-context']) data_context = c.props['data-context'];
    if (c.props?.['data-filter']) data_filter = c.props['data-filter'];

    if (c.props && props.data) {
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;

        let className = attribs.className || '';

        if (attribs['data-show-on']) return <DataShowOn {...attribs} element={c} />;

        if (data_context && data_filter) {
          const { [data_filter]: dataset } = props.data[data_context] as {
            [k: string]: { [k: string]: unknown };
          };

          if (dataset?.length) {
            return cloneElement(
              c,
              {
                className,
                'data-rexifier': FILE,
                'data-context': data_context,
                'data-filter': data_filter,
              },
              <ContextListIterator {...props} dataset={dataset} data={props.data} {...attribs}>
                {sub}
              </ContextListIterator>,
            );
          }
        } else if (data_context || c.type === 'form') {
          className = className ? `${className} rexified` : 'rexified';
          // if data of context already fetched
          if (c.type === 'form' || attribs['data-form']) {
            // Form rexify step
            return (
              <FormComponent {...attribs} {...props} className={className} data-context={data_context} action={attribs['action']}>
                {sub}
              </FormComponent>
            );
          } else if (props.data[data_context]) {
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
            } else if (data_context === 'property' && props.data[data_context]) {
              if (attribs['data-field-group']) {
                return (
                  <DataFieldGroup {...props} data={props.data[data_context]} {...attribs}>
                    {c}
                  </DataFieldGroup>
                );
              } else if (c.props['data-group']) {
                const { [c.props['data-group']]: related_recordset } = props.data[data_context] as {
                  [k: string]: { [k: string]: string }[];
                };
                if (related_recordset) {
                  return cloneElement(
                    c,
                    {
                      className,
                      'data-rexifier': FILE,
                      'data-context': data_context,
                      'data-relation': 'related_recordset',
                    },
                    <ContextListIterator {...props} data-filter={c.props['data-group']} dataset={related_recordset} data={props.data} {...attribs}>
                      {sub}
                    </ContextListIterator>,
                  );
                }
              } else if (c.props['data-groups']) {
                const main_data_container = props.data[data_context];
                const values: { label: string; icon: string; value: string }[] = [];

                c.props['data-groups'].split(',').forEach((relationship_name: string) => {
                  if (main_data_container) {
                    const { [relationship_name]: related_recordsets } = main_data_container as {
                      [k: string]: string[];
                    };

                    consoler(FILE, { related_recordsets });

                    if (related_recordsets && related_recordsets.length) {
                      related_recordsets.forEach(kv => {
                        const val = getPropertyIconAndTitle(kv);
                        if (values.filter(v => v.icon === val.icon).length === 0) {
                          values.push(val);
                        }
                      });
                    }
                  }
                });

                if (values.length) {
                  consoler(FILE, { values });
                  return cloneElement(c, {}, <ContextStatsIterator dataset={values}>{c}</ContextStatsIterator>);
                }
              } else if (c.props['data-stat']) {
                try {
                  const {
                    stats: { [c.props['data-stat']]: values },
                  } = props.data[data_context] as {
                    stats: {
                      [k: string]: { label: string; value: string }[];
                    };
                  };
                  if (values) {
                    return <ContextStatsIterator dataset={values}>{c}</ContextStatsIterator>;
                  }
                } catch (e) {
                  consoler(FILE, e);
                }
              }
            }

            return cloneElement(
              c,
              { ...attribs, className, 'data-rexifier': FILE, 'data-context': data_context },
              <ContextIterator {...props} data-context={data_context} data-filter={data_filter}>
                {sub}
              </ContextIterator>,
            );
          } else {
            // consoler(FILE, 'No data context for ' + data_context);
          }
        } else if (attribs['data-action']) {
          return (
            <DataAction {...props} {...attribs} context-data={props.data[data_context]}>
              {c}
            </DataAction>
          );
        } else if (attribs['data-modal']) {
          return <DataModal element={c} {...attribs} />;
        }
        // return cloneElement(c, {
        //   className,
        //   'data-rexifier': FILE,
        //   'data-context': data_context,
        // });
        return cloneElement(
          c,
          {
            className,
            ...attribs,
            'data-context': data_context,
            'data-filter': data_filter,
          },
          <ContextIterator {...props} data-context={data_context} data-filter={data_filter}>
            {sub}
          </ContextIterator>,
        );
      } else if (c.props['data-field'] || c.props['data-fields'] || c.props['data-image'] || c.props['data-input']) {
        const atomic_parameters: {
          data?: { [k: string]: unknown };
          'data-context': string;
        } = {
          ...props,
          data: (props.data?.[data_context] || props.data) as {},
          'data-context': data_context,
        };

        if (data_filter && atomic_parameters.data?.[data_filter]) {
          const { [data_filter]: main_data, ...rest_of_data } = atomic_parameters.data;
        }

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
    }
    return c;
  });
  return <>{rexifier}</>;
}
