'use client';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { AgentData } from '@/_typings/agent';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import { objectToQueryString } from '@/_utilities/url-helper';
import { useRouter } from 'next/navigation';
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
          href: undefined,
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
        {
          ...kv,
          href: '/ddd',
        },
        typeof c.props.children === 'string' ? c.props.children : <Iterator handleEvent={handleEvent}>{c.props.children}</Iterator>,
      );
    }
    return cloneElement(<div className={c.props?.className || ''} />, kv);
  });

  return <>{Rexified}</>;
}
export default function Navbar({ agent, children }: { agent?: AgentData; children: ReactElement }) {
  const router = useRouter();
  const handleEvent = (evt_name: string) => {
    if (evt_name === 'my-dashboard') router.push('my-saved-properties');
    else if (evt_name === 'map' && agent?.metatags?.geocoding) {
      let map_url = `/map?${objectToQueryString(agent.metatags.geocoding as unknown as { [k: string]: string })}`;
      if (!agent.domain_name) {
        map_url = `${agent.metatags.profile_slug}${map_url}`;
      }
      router.push(map_url);
    }
  };
  return (
    <nav>
      <Iterator handleEvent={handleEvent}>{children}</Iterator>
    </nav>
  );
}
