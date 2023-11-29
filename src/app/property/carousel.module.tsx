'use client';
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function PropertyPhotoAlbumCarousel({ photos }: { photos: string[] }) {
  let [isOpen, setIsOpen] = useState(true);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as='div' className='relative z-[999]' onClose={closeModal}>
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
                <Dialog.Panel className='w-full h-[calc(100vh_-_2rem)] transform overflow-hidden bg-transparent p-6 text-left align-middle transition-all'>
                  <div className='right-0 top-0 absolute z-[1000] cursor-pointer'>
                    <XCircleIcon className='h-8 w-8 text-white' />
                  </div>
                  <div className='relative'>
                    <div className='mt-2 relative h-[calc(100vh_-_6rem_-_10rem)] rounded-xl overflow-hidden'>
                      {photos.map(url => (
                        <Image key={url} alt='Image file' src={url} fill style={{ objectFit: 'cover' }} sizes='100%' />
                      ))}
                    </div>
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
