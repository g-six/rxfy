'use client';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import { objectToQueryString } from '@/_utilities/url-helper';
import { useRouter } from 'next/navigation';
import { Children, ReactElement, SyntheticEvent, cloneElement } from 'react';
import SimpleDropdown from '@/components/Dropdowns/SimpleDropdown.module';

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
      return cloneElement(c, {}, convertDivsToSpans(c.props.children));
    }
    if (['svg', 'img'].includes(c.type as string)) {
      return c;
    }
    if (c.props?.children) {
      let className = classNames(c.props.className || '', 'navbar.module.Iterator.' + c.type);
      if (className.includes('w-dropdown')) {
        return <SimpleDropdown className={className}>{c.props.children}</SimpleDropdown>;
      }
      return cloneElement(
        c.type === 'a' ? <a /> : <div />,
        {
          ...kv,
          className,
        },
        typeof c.props.children === 'string' ? c.props.children : <Iterator handleEvent={handleEvent}>{c.props.children}</Iterator>,
      );
    }
    return cloneElement(<div className={c.props?.className || ''} />, kv);
  });

  return <>{Rexified}</>;
}
export default function Navbar({ agent, children, ...props }: { agent?: AgentData; children: ReactElement; className: string }) {
  const router = useRouter();
  const handleEvent = (evt_name: string) => {
    if (evt_name === 'my-dashboard') router.push('my-saved-properties');
    else if (evt_name === 'map' && agent?.metatags?.geocoding) {
      let map_url = `/map?${objectToQueryString(agent.metatags.geocoding as unknown as { [k: string]: string })}`;
      if (!agent.domain_name) {
        map_url = `${agent.metatags.profile_slug}${map_url}`;
      }
      router.push(map_url);
    } else console.log({ evt_name });
  };
  return (
    <nav {...props}>
      <Iterator handleEvent={handleEvent}>{children}</Iterator>
    </nav>
  );
}
