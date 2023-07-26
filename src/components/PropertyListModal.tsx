import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import RxPropertyCard from './RxCards/RxPropertyCard';
import { classNames } from '@/_utilities/html-helper';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { RxSmallPropertyCard } from './RxCards/RxSmallPropertyCard';
import { PropertyDataModel } from '@/_typings/property';
import { AgentData } from '@/_typings/agent';
import styles from './PropertyListModal.module.scss';

type PropertyListProps = {
  properties: PropertyDataModel[];
  card?: React.ReactElement;
  onClose(): void;
  agent?: AgentData;
  'view-only'?: boolean;
  onClick?: (property: PropertyDataModel) => void;
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
              <Dialog.Panel className='flex flex-col gap-4 relative transform rounded-2xl bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-xl lg:max-w-2xl px-0'>
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
                    'relative overflow-y-auto rounded-2xl',
                    p['view-only'] ? 'lg:w-80' : '',
                    p.properties.length > 1 ? 'px-0' : 'w-72 sm:w-72',
                    p.properties.length > 4 && 'h-[23.25rem]',
                  )}
                >
                  {p.properties &&
                    p.properties.map(
                      listing =>
                        listing.mls_id &&
                        (p.properties.length === 1 && p.card ? (
                          <RxPropertyCard
                            key={listing.mls_id}
                            listing={listing}
                            sequence={0}
                            agent={p.agent?.id}
                            view-only={p['view-only']}
                            onClick={
                              p.onClick
                                ? () => {
                                    p.onClick && p.onClick(listing);
                                  }
                                : undefined
                            }
                          >
                            {React.cloneElement(<div />, {
                              ...p.card.props.children.props,
                              // Wrap grandchildren too
                              children: <>{p.card.props.children.props.children}</>,
                            })}
                          </RxPropertyCard>
                        ) : (
                          <RxSmallPropertyCard
                            className={[styles['cluster-item'], 'w-full m-0 hover:bg-indigo-100 flex p-1', p['view-only'] ? 'gap-1 overflow-hidden' : ''].join(
                              ' ',
                            )}
                            onClick={
                              p.onClick
                                ? () => {
                                    p.onClick && p.onClick(listing);
                                  }
                                : undefined
                            }
                            key={listing.id}
                            {...listing}
                          />
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
