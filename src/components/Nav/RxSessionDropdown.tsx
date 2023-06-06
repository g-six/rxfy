'use client';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { Transition } from '@headlessui/react';
import React from 'react';
import styles from './RxDropdownMenu.module.scss';
import useEvent, { Events } from '@/hooks/useEvent';
import { RxAgentTextWrapper } from '../RxAgentInfoWrappers/RxAgentTextWrapper';
import { AgentData } from '@/_typings/agent';

type Props = {
  children: React.ReactElement;
  agent?: AgentData;
  className?: string;
};
function DropdownLightbox(p: Props) {
  const evt = useEvent(Events.ToggleUserMenu);
  return (
    <Transition
      key='confirmation'
      show={evt.data?.show || false}
      as='div'
      className={p.className || ''}
      enter='transform ease-out duration-200 transition'
      enterFrom='md:-translate-y-2 opacity-0 translate-y-0'
      enterTo='translate-y-0 opacity-100'
      leave='transition ease-in duration-300'
      leaveFrom='opacity-100 translate-y-0'
      leaveTo='opacity-0 md:-translate-y-2 translate-y-0'
    >
      {p.children}
    </Transition>
  );
}
export default function RxSessionDropdown(p: Props) {
  const evt = useEvent(Events.ToggleUserMenu);
  const matches = [
    {
      searchFn: searchByClasses(['w-dropdown-toggle']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          id: `${Events.ToggleUserMenu}-trigger`,
          className: child.props.className + ` RxSessionDropdown ${evt.data?.show ? ' w--open' : ''} rexified`,
          onClick: () => {
            evt.fireEvent({ show: !evt.data?.show });
          },
        }),
    },
    {
      searchFn: searchByClasses(['w-dropdown-list']),
      transformChild: (child: React.ReactElement) => (
        <DropdownLightbox className={child.props.className + ` w--open rexified ${styles.dropdown} ${styles['session-dropdown']}`}>
          {child.props.children}
        </DropdownLightbox>
      ),
    },
    {
      searchFn: searchByClasses(['agent-name']),
      transformChild: (child: React.ReactElement) => (
        <RxAgentTextWrapper attribute='full_name' className={child.props.className}>
          <>{p.agent?.full_name ? p.agent.full_name : child.props.children}</>
        </RxAgentTextWrapper>
      ),
    },
  ];
  //sessions-wrapper
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const global = globalThis as any;
      if (global.webflow_script) {
        document.body.appendChild(global.webflow_script);
      }
    }
  }, []);
  return <>{transformMatchingElements(p.children, matches)}</>;
}
