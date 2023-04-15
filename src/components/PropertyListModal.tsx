import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PropertyCardSmall } from './RxCards/RxPropertyCard';
import { classNames } from '@/_utilities/html-helper';

type PropertyListProps = {
  properties: Record<string, string | number | string[]>[];
  onClose(): void;
};

export default function PropertyListModal(p: PropertyListProps) {
  let element = null;
  if (typeof document !== 'undefined') {
    element = document.getElementsByClassName('property-card-map')[0];

    // TODO
    // if (element) {
    //   element.childNodes.forEach((child) => {
    //     console.log({ child });
    //   });
    // }
  }
  const [card, setCardElement] = useState<Node | null>(element);

  useEffect(() => {}, []);

  return (
    <Transition.Root show={p.properties && p.properties.length > 0} as={Fragment}>
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
              enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            >
              <Dialog.Panel className='flex flex-col gap-4 relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-sm lg:max-w-lg py-1 px-0'>
                <div className={classNames('overflow-y-auto px-1', p.properties.length > 4 && 'h-[23.25rem]')}>
                  {p.properties &&
                    p.properties.map(
                      listing =>
                        listing.id && (
                          <PropertyCardSmall className='w-full shadow-none m-0 hover:bg-indigo-100 p-1 rounded-2xl' key={listing.id as string} {...listing} />
                        ),
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
