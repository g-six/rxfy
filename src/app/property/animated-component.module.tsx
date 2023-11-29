'use client';

import { ReactElement, cloneElement } from 'react';
import { Transition } from '@headlessui/react';

export default function AnimatedComponent({ children, ...props }: { children: ReactElement }) {
  return (
    <Transition
      appear={false}
      show={true}
      enter='transition-opacity duration-75'
      enterFrom='opacity-0'
      enterTo='opacity-100'
      leave='transition-opacity duration-150'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
    >
      {children}
    </Transition>
  );
}
