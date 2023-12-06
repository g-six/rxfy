'use client';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events } from '@/hooks/useEvent';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactElement } from 'react';

export function RxLightboxTrigger({ children, ...attributes }: { children: ReactElement; 'content-id': string }) {
  const { fireEvent } = useEvent(Events.Lightbox);
  return (
    <div
      {...attributes}
      className='cursor-pointer'
      onClick={() => {
        fireEvent({
          clicked: attributes['content-id'],
          show: true,
        });
      }}
    >
      {children}
    </div>
  );
}
export function RxLightbox({ children, ...attributes }: { children: ReactElement; 'content-width'?: number; 'content-id': string; 'content-height'?: number }) {
  const { data, fireEvent } = useEvent(Events.Lightbox);

  return (
    <>
      <Transition appear show={data && data.show && data.clicked === attributes['content-id'] ? true : false} as={Fragment}>
        <Dialog
          as='div'
          className='relative z-10'
          onClose={() => {
            fireEvent({
              show: false,
            });
          }}
        >
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-100'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black/50' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 -translate-y-1/2'
                enterTo='opacity-100 translate-y-0'
                leave='ease-in duration-100'
                leaveFrom='opacity-100 translate-y-0'
                leaveTo='opacity-0 translate-y-1/2'
              >
                <Dialog.Panel
                  className='transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-xl transition-all'
                  style={{
                    width: 'auto',
                    height: 'auto',
                  }}
                >
                  {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
export default function RxDialog() {
  const { fireEvent: promptConfirmation, data: dialog } = useEvent(Events.Prompt);

  function closeModal() {
    promptConfirmation({});
  }
  function confirmAction() {
    promptConfirmation({
      clicked: 'Confirm Action',
    });
  }

  return (
    <>
      <Transition appear show={!!dialog?.message} as={Fragment}>
        <Dialog as='div' className='relative z-10' onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-100'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black/25' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 -translate-y-1/2'
                enterTo='opacity-100 translate-y-0'
                leave='ease-in duration-100'
                leaveFrom='opacity-100 translate-y-0'
                leaveTo='opacity-0 translate-y-1/2'
              >
                <Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900 mt-0'>
                    {dialog?.message ? 'Are you sure' : ''}
                  </Dialog.Title>
                  <div className='mt-2'>
                    <p className='text-sm text-gray-500'>
                      {dialog?.message || 'Your payment has been successfully submitted. We’ve sent you an email with all of the details of your order.'}
                    </p>
                  </div>

                  <div className='mt-4 flex gap-2 justify-end'>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2'
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 w-20'
                      onClick={confirmAction}
                    >
                      Yes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
