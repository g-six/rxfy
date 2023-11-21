import { Menu, Transition } from '@headlessui/react';
import { Children, Fragment, ReactElement, useEffect, useRef, useState } from 'react';
import styles from './folder-actions.module.scss';
export default function MyDocumentsFolderActions({
  children,
  icon,
  menuClassName,
  handleAction,
  ...props
}: {
  icon: ReactElement;
  menuClassName: string;
  className: string;
  children: ReactElement;
  handleAction(action: string): void;
}) {
  return (
    <>
      <Menu as='div' className='relative inline-block text-left'>
        <Menu.Button {...props}>{icon}</Menu.Button>
        <Transition
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'
        >
          <Menu.Items className={styles.menu + ' w--open ' + menuClassName}>
            {Children.map(children, c => (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => {
                      handleAction(c.props['data-action']);
                    }}
                    className={`${active ? '' : ''} ${c.props?.className || ''}`}
                  >
                    {c.props.children}
                  </button>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
}

function EditInactiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M4 13V16H7L16 7L13 4L4 13Z' fill='#EDE9FE' stroke='#A78BFA' strokeWidth='2' />
    </svg>
  );
}

function EditActiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M4 13V16H7L16 7L13 4L4 13Z' fill='#8B5CF6' stroke='#C4B5FD' strokeWidth='2' />
    </svg>
  );
}

function DuplicateInactiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M4 4H12V12H4V4Z' fill='#EDE9FE' stroke='#A78BFA' strokeWidth='2' />
      <path d='M8 8H16V16H8V8Z' fill='#EDE9FE' stroke='#A78BFA' strokeWidth='2' />
    </svg>
  );
}

function DuplicateActiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M4 4H12V12H4V4Z' fill='#8B5CF6' stroke='#C4B5FD' strokeWidth='2' />
      <path d='M8 8H16V16H8V8Z' fill='#8B5CF6' stroke='#C4B5FD' strokeWidth='2' />
    </svg>
  );
}

function ArchiveInactiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect x='5' y='8' width='10' height='8' fill='#EDE9FE' stroke='#A78BFA' strokeWidth='2' />
      <rect x='4' y='4' width='12' height='4' fill='#EDE9FE' stroke='#A78BFA' strokeWidth='2' />
      <path d='M8 12H12' stroke='#A78BFA' strokeWidth='2' />
    </svg>
  );
}

function ArchiveActiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect x='5' y='8' width='10' height='8' fill='#8B5CF6' stroke='#C4B5FD' strokeWidth='2' />
      <rect x='4' y='4' width='12' height='4' fill='#8B5CF6' stroke='#C4B5FD' strokeWidth='2' />
      <path d='M8 12H12' stroke='#A78BFA' strokeWidth='2' />
    </svg>
  );
}

function MoveInactiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M10 4H16V10' stroke='#A78BFA' strokeWidth='2' />
      <path d='M16 4L8 12' stroke='#A78BFA' strokeWidth='2' />
      <path d='M8 6H4V16H14V12' stroke='#A78BFA' strokeWidth='2' />
    </svg>
  );
}

function MoveActiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M10 4H16V10' stroke='#C4B5FD' strokeWidth='2' />
      <path d='M16 4L8 12' stroke='#C4B5FD' strokeWidth='2' />
      <path d='M8 6H4V16H14V12' stroke='#C4B5FD' strokeWidth='2' />
    </svg>
  );
}

function DeleteInactiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect x='5' y='6' width='10' height='10' fill='#EDE9FE' stroke='#A78BFA' strokeWidth='2' />
      <path d='M3 6H17' stroke='#A78BFA' strokeWidth='2' />
      <path d='M8 6V4H12V6' stroke='#A78BFA' strokeWidth='2' />
    </svg>
  );
}

function DeleteActiveIcon(props: { [k: string]: string }) {
  return (
    <svg {...props} viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect x='5' y='6' width='10' height='10' fill='#8B5CF6' stroke='#C4B5FD' strokeWidth='2' />
      <path d='M3 6H17' stroke='#C4B5FD' strokeWidth='2' />
      <path d='M8 6V4H12V6' stroke='#C4B5FD' strokeWidth='2' />
    </svg>
  );
}
