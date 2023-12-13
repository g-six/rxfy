import { Children, ReactElement, cloneElement } from 'react';
import DataFieldAtom from './data-field.atom';
import { consoler } from '@/_helpers/consoler';
import ContextListIterator from './context-list.iterator';

interface Props {
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}

async function ContextIterator({ children, ...props }: { children: ReactElement } & Props) {
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
