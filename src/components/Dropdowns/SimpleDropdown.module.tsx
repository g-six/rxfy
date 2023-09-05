'use client';

import { ReactElement, Fragment, Children } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { classNames } from '@/_utilities/html-helper';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';

function Iterator(p: { children: ReactElement; className?: string }) {
  const Rexified = Children.map(p.children, c => {
    if (['nav', 'div'].includes(c.type as string) && typeof c.props?.children !== 'string') {
      const { children: sub, ...props } = c.props;

      if (props.className?.split(' ').includes('w-dropdown-toggle')) {
        return <Menu.Button className={classNames(props.className, 'bg-transparent')}>{convertDivsToSpans(c.props.children)}</Menu.Button>;
      }
      if (props.className?.split(' ').includes('w-dropdown-list')) {
        return (
          <Transition
            as={Fragment}
            enter='transition ease-out duration-100'
            enterFrom='transform opacity-0 scale-95'
            enterTo='transform opacity-100 scale-100'
            leave='transition ease-in duration-75'
            leaveFrom='transform opacity-100 scale-100'
            leaveTo='transform opacity-0 scale-95'
          >
            <Menu.Items className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
              <div className='py-1'>
                <Iterator>{sub}</Iterator>
              </div>
            </Menu.Items>
          </Transition>
        );
      }
      return (
        <div {...props}>
          <Iterator>{sub}</Iterator>
        </div>
      );
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default function SimpleDropdown({ children, className }: { children: ReactElement; className: string }) {
  return (
    <Menu as='div' className={className}>
      <Iterator>{children}</Iterator>
    </Menu>
  );
}
