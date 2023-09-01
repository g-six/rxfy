'use client';
import { DOMNode, domToReact, htmlToDOM } from 'html-react-parser';
import { Children, ReactElement, cloneElement } from 'react';

function Iterator({ children, ...p }: { children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    let kv = {};
    if (c.props) {
      Object.keys(c.props)
        .filter(k => k !== 'children' && k.indexOf('data-') !== 0)
        .forEach(k => {
          kv = {
            ...kv,
            [k]: c.props[k],
          };
        });
    }
    if (['svg', 'img'].includes(c.type as string)) {
      return c;
    }
    if (c.props?.children) {
      return cloneElement(
        c.type === 'a' ? <a className={c.props.className || ''} /> : <div className={c.props.className || ''} />,
        kv,
        typeof c.props.children === 'string' ? c.props.children : <Iterator>{c.props.children}</Iterator>,
      );
    }
    return cloneElement(<div className={c.props?.className || ''} />, kv);
  });

  return <>{Rexified}</>;
}
export default function Navbar({ children }: { children: ReactElement }) {
  return (
    <nav>
      <Iterator>{children}</Iterator>
    </nav>
  );
}
