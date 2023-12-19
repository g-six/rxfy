import { Children, ReactElement, cloneElement } from 'react';
import DataFieldAtom from './data-field.atom';
import ContextListIterator from './context-list.iterator';
import FormComponent from './client-components/form.client-component';
import DataShowOn from './data-show.client-component';

interface Props {
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}

function ContextIterator({ children, ...props }: { children: ReactElement } & Props) {
  const rexifier = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        let className = attribs.className || '';
        // if (className.split(' ').includes('contact-form-wrapper')) return <></>;
        // if (className.split(' ').includes('navigation')) return <></>;
        // if (className.includes('navigation')) return <></>;
        // if (className.includes('f-section-small')) return <></>;
        // if (className.includes('f-section-regular')) return <></>;
        // if (className.includes('recent-listings-section')) return <></>;
        // if (className.includes('image-gallery')) return <></>;
        // if (className.includes('links-hide-show')) return <></>;
        // if (className.includes('id-card')) return <></>;
        // if (className.includes('property-action-buttons')) return <></>;
        // if (className.includes('recent-listings')) return <></>;
        // if (className.includes('sold-listings')) return <></>;
        // if (className.includes('multiple-agent-names')) return <></>;
        // if (className.includes('2-contexts')) return <></>;

        if (attribs['data-show-on']) {
          return <DataShowOn {...attribs} element={c} />;
        }
        if (attribs['data-context'] || c.type === 'form') {
          if (props.data) {
            const data_context = attribs['data-context'] || props['fallback-context'];

            className = className ? `${className} rexified` : 'rexified';
            // if data of context already fetched
            if (props.data[attribs['data-context']]) {
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
                    },
                    <ContextListIterator {...props} dataset={dataset} data={props.data} {...attribs}>
                      {sub}
                    </ContextListIterator>,
                  );
                }
              }

              // If no data-filter is present on the requested context
              // then we expect to only get one record of that context
              // eg. single property listing
              return cloneElement(
                c,
                {
                  className,
                },
                <DataFieldAtom {...props} {...attribs}>
                  {sub}
                </DataFieldAtom>,
              );
            } else {
              // Form rexify step
              return (
                <FormComponent {...attribs} {...props} className={className}>
                  {sub}
                </FormComponent>
              );
              cloneElement(
                c,
                {
                  className,
                  method: 'post',
                },
                <DataFieldAtom {...props} {...attribs}>
                  {sub}
                </DataFieldAtom>,
              );
            }
          }
        }

        return cloneElement(
          c,
          {
            className,
          },
          <ContextIterator {...props}>{sub}</ContextIterator>,
        );
      }
      return cloneElement(c);
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
