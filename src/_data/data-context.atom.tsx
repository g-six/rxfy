import { Children, ReactElement, cloneElement } from 'react';
import DataFieldAtom from './data-field.atom';

async function ContextIterator({ children, ...props }: { children: ReactElement; 'fallback-context': string; data?: { [k: string]: unknown } }) {
  const rexifier = Children.map(children, async c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        let className = attribs.className || '';
        className = className ? `${className} rexified` : 'rexified';

        if (attribs['data-context']) {
          if (props.data) {
            // if data of context already fetched
            if (props.data[attribs['data-context']]) {
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
                    <DataFieldAtom data={dataset[0]} base-context={props.data[props['fallback-context']]} {...attribs}>
                      {sub}
                    </DataFieldAtom>,
                  );
                }
              }
              return cloneElement(
                c,
                {
                  className,
                },
                <DataFieldAtom data={props.data[attribs['data-context']]} {...attribs}>
                  {sub}
                </DataFieldAtom>,
              );
            } else {
              console.log('No data for', attribs['data-context']);
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
  });
  return <>{rexifier}</>;
}

export default async function DataContextAtom({
  children,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}) {
  return <ContextIterator {...props}>{children}</ContextIterator>;
}
