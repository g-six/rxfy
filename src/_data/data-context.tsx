import { Children, ReactElement, cloneElement } from 'react';
import ContextIterator from './data-context.iterator';
import { consoler } from '@/_helpers/consoler';

interface Props {
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'data-context': string;
  'fallback-context'?: string;
}
const FILE = 'data-context.tsx';
export default async function DataContext({
  children,
  ...props
}: {
  children: ReactElement[];
} & Props) {
  return (
    <>
      {Children.map(children, c => {
        const { children: sub, ...attribs } = c.props;

        return cloneElement(
          c,
          {},
          <ContextIterator {...props} {...attribs}>
            {sub}
          </ContextIterator>,
        );
      })}
    </>
  );
}
