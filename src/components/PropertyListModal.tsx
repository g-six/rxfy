import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import RxPropertyCard from './RxCards/RxPropertyCard';
import { classNames } from '@/_utilities/html-helper';
import { MLSProperty } from '@/_typings/property';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { RxSmallPropertyCard } from './RxCards/RxSmallPropertyCard';

type PropertyListProps = {
  properties: Record<string, string | number | string[]>[];
  card?: React.ReactElement;
  onClose(): void;
};

export default function PropertyListModal(p: PropertyListProps) {
  return (
    <Transition.Root show={p.properties && p.properties.length > 0} as={React.Fragment}>
      <Dialog as='div' className='relative z-10' onClose={p.onClose}>
        <Transition.Child
          as='div'
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
        </Transition.Child>

        <div className='fixed inset-0 z-10 overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <Transition.Child
              as='div'
              enter='ease-out duration-300'
              enterFrom='opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-2 sm:translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            >
              <Dialog.Panel
                className={`flex flex-col gap-4 relative transform rounded-2xl bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-sm lg:max-w-lg px-0${
                  p.properties.length > 1 ? ' py-1' : ''
                }`}
              >
                <button
                  type='button'
                  className={`text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-0 bg-black absolute -top-2 -right-2 z-20 rounded-full w-6 h-6 flex flex-col items-center justify-center ${
                    p.properties && p.properties.length > 0 ? '' : 'hidden'
                  }`}
                  onClick={() => {
                    p.onClose();
                  }}
                >
                  <span className='sr-only'>Close</span>
                  <XMarkIcon className='h-4 w-4' aria-hidden='true' />
                </button>
                <div
                  className={classNames(
                    'relative overflow-y-auto',
                    p.properties.length > 1 ? 'px-1' : 'w-72 sm:w-72',
                    p.properties.length > 4 && 'h-[23.25rem]',
                  )}
                >
                  {p.properties &&
                    p.properties.map(
                      listing =>
                        listing.id &&
                        (p.properties.length === 1 && p.card ? (
                          <RxPropertyCard key={listing.id as string} listing={listing as unknown as MLSProperty} sequence={0}>
                            {React.cloneElement(<div />, {
                              ...p.card.props.children.props,
                              // Wrap grandchildren too
                              children: <>{p.card.props.children.props.children}</>,
                            })}
                          </RxPropertyCard>
                        ) : (
                          <RxSmallPropertyCard className='w-full shadow-none m-0 hover:bg-indigo-100 p-1 rounded-2xl' key={listing.id as string} {...listing} />
                        )),
                    )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
