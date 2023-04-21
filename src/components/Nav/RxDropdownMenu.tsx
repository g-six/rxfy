'use client';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { AgentData } from '@/_typings/agent';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import useEvent, { Events } from '@/hooks/useEvent';
import { Transition } from '@headlessui/react';
import React from 'react';

import styles from './RxDropdownMenu.module.scss';
import Cookies from 'js-cookie';
import { RxUserSessionLink } from './RxUserSessionLink';

type DropdownProps = {
  ['agent-data']: AgentData;
  children: React.ReactElement[];
  className: string;
};

type PopupProps = {
  className: string;
  children?: React.ReactElement[];
};

type ToggleButtonProps = {
  ['agent-data']: AgentData;
  node: React.ReactElement;
};

function RxNavPopup(p: PopupProps) {
  const { data } = useEvent(Events.ToggleUserMenu);
  const matches = [
    {
      searchFn: searchByClasses(['in-session']),
      transformChild: (child: React.ReactElement) => <RxUserSessionLink {...child.props}>{child.props.children}</RxUserSessionLink>,
    },
    {
      searchFn: searchByClasses(['out-session']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          className: [child.props.className, Cookies.get('session_key') ? 'hidden' : 'nice'].join(' '),
        }),
    },
  ];
  return (
    <Transition
      key='confirmation'
      show={data?.show || false}
      as='nav'
      enter='transform ease-out duration-500 transition'
      enterFrom='-translate-y-2 opacity-0'
      enterTo='translate-y-0 opacity-100'
      leave='transition linear duration-500'
      leaveFrom='opacity-100 translate-y-0'
      leaveTo='opacity-0 -translate-y-2'
      className={[p.className, 'w--open', styles.dropdown].join(' ')}
    >
      {transformMatchingElements(p.children, matches)}
    </Transition>
  );
}
function RxToggleButton(p: ToggleButtonProps) {
  const { data, fireEvent } = useEvent(Events.ToggleUserMenu);
  const matches = [
    {
      searchFn: searchByClasses(['button', 'indigo']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(<span />, {
          ...child.props,
        }),
    },
    {
      searchFn: searchByClasses(['text-block-10']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(<span />, {
          ...child.props,
        }),
    },
  ];
  return (
    <button
      type='button'
      className={p.node.props.className}
      onClick={() => {
        fireEvent({ show: !data.show });
      }}
      id={`${Events.ToggleUserMenu}-trigger`}
    >
      {transformMatchingElements(p.node.props.children, matches)}
    </button>
  );
}

export default function RxDropdownMenu(p: DropdownProps) {
  const matches = [
    {
      searchFn: searchByClasses(['w-dropdown-toggle']),
      transformChild: (child: React.ReactElement) => <RxToggleButton node={child} agent-data={p['agent-data']} />,
    },
    {
      searchFn: searchByClasses(['w-dropdown-list']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(<RxNavPopup className={child.props.className || ''} />, {
          ...child.props,
        }),
    },
  ];

  return <>{transformMatchingElements(p.children, matches)}</>;
}