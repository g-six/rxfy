import { classNames } from '@/_utilities/html-helper';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';

function getHeight(filename: string) {
  const extension = filename.toLowerCase().split('/').pop() || '';
  if (['.jpg', '.png', '.jpeg', '.svg'].includes(extension)) {
    return '';
  }
  return 'h-[calc(100vh_-_4rem)]';
}

export default function MyDocumentsPreviewDocumentDialog(attr: { data?: string; height?: number }) {
  let [isOpen, setIsOpen] = useState(!!attr.data);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen && attr.data) {
      openModal();
    }
  }, [attr.data]);

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as='div' className='relative z-10' onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
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
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel
                  className={classNames(
                    `${attr.data ? getHeight(attr.data) : ''}` || 'max-w-lg max-lg:max-w-2xl',
                    'w-full transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col items-center justify-center',
                  )}
                >
                  <object className='w-full h-full' {...attr} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
