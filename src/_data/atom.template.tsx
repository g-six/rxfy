import { Children, ReactElement, cloneElement } from 'react';

async function AtomIterator({ children }: { children: ReactElement }) {
  const rexifier = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        let className = attribs.className || '';
        className = className ? `${className} rexified` : 'rexified';
        return cloneElement(
          c,
          {
            className,
          },
          <AtomIterator>{sub}</AtomIterator>,
        );
      }
      return c;
    }
  });
  return <>{rexifier}</>;
}

export default async function DataContextAtom({ children }: { children: ReactElement }) {
  return <AtomIterator>{children}</AtomIterator>;
}
