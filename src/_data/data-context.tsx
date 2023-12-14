import { Children, ReactElement, cloneElement } from 'react';
import DataFieldAtom from './data-field.atom';
import { consoler } from '@/_helpers/consoler';
import ContextListIterator from './context-list.iterator';

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
        className = className ? `${className} rexified` : 'rexified';

        if (attribs['data-context']) {
          if (props.data) {
            // if data of context already fetched
            if (props.data[attribs['data-context']]) {
              // Filter presence tells us that the context contains multiple records
              // and should be laid out in a grid or list wrapper that requires a loop
              // to iterate over the records. eg. list of recent listings
              const filter = attribs['data-filter'];
              if (filter) {
                const { [filter]: dataset } = props.data[attribs['data-context']] as unknown as {
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
      return c;
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
  return <ContextIterator {...props}>{children}</ContextIterator>;
}
