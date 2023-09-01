'use client';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import { Children, ReactElement, SyntheticEvent, cloneElement } from 'react';

function Iterator({ children, handleEvent }: { children: ReactElement; handleEvent(event_name: string): void }) {
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
    if (c.type === 'a') {
      return cloneElement(
        <div
          onClick={(evt: SyntheticEvent<HTMLDivElement>) => {
            handleEvent(slugifyAddress(evt.currentTarget.innerText));
          }}
        />,
        {
          ...c.props,
          className: classNames(c.props.className || '', 'cursor-pointer'),
        },
        convertDivsToSpans(c.props.children),
      );
    }
    if (['svg', 'img'].includes(c.type as string)) {
      return c;
    }
    if (c.props?.children) {
      return cloneElement(
        c.type === 'a' ? <a className={c.props.className || ''} /> : <div className={c.props.className || ''} />,
        kv,
        typeof c.props.children === 'string' ? c.props.children : <Iterator handleEvent={handleEvent}>{c.props.children}</Iterator>,
      );
    }
    return cloneElement(<div className={c.props?.className || ''} />, kv);
  });

  return <>{Rexified}</>;
}
export default function Navbar({ children }: { children: ReactElement }) {
  const handleEvent = (evt_name: string) => {
    console.log(evt_name);
  };
  return (
    <nav>
      <Iterator handleEvent={handleEvent}>{children}</Iterator>
    </nav>
  );
}
