import { Children, Fragment, MouseEvent, ReactElement } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface BaseProps {
  children: ReactElement;
  className?: string;
  onActionClick: (e: MouseEvent<HTMLButtonElement>) => void;
}
interface Props extends BaseProps {
  btnClassName: string;
}

function Iterator({ children, onActionClick }: BaseProps) {
  const Wrapped = Children.map(children, child => {
    if (child?.type === 'a' && child?.props.children) {
      return (
        <Menu.Item>
          {({ active }) => (
            <button
              type='button'
              className={classNames(
                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700 bg-transparent',
                'block w-full text-left px-4 py-2 text-sm',
                child?.props?.className,
              )}
              onClick={onActionClick}
            >
              {child?.props.children}
            </button>
          )}
        </Menu.Item>
      );
    } else if (child?.props?.children && child?.props?.className) {
      return (
        <Iterator className={child.props.className} onActionClick={onActionClick}>
          {child.props.children}
        </Iterator>
      );
    }
  });
  return <>{Wrapped}</>;
}

export default function RxTwCombo(p: Props) {
  return (
    <Menu as='div' className='relative flex text-left'>
      <div className={p.btnClassName}>
        <Menu.Button className='flex items-center bg-transparent text-gray-400 hover:text-gray-600 px-1.5 py-2'>
          <span className='sr-only'>Open options</span>
          <EllipsisHorizontalIcon className='h-5 w-5' aria-hidden='true' />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter='transition ease-out duration-100'
        enterFrom='transform opacity-0 scale-95'
        enterTo='transform opacity-100 scale-100'
        leave='transition ease-in duration-75'
        leaveFrom='transform opacity-100 scale-100'
        leaveTo='transform opacity-0 scale-95'
      >
        <Menu.Items className='absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
          <div className='overflow-hidden'>
            <Iterator {...p} className={p.btnClassName}>
              {p.children}
            </Iterator>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
