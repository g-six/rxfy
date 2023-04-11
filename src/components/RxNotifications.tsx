'use client';

import { Fragment, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';

export default function RxNotifications() {
  const { data, fireEvent } = useEvent(Events.SystemNotification);
  const [error, setErrorMessage] = useState('');
  const [success, setSuccessMessage] = useState('');

  useEffect(() => {
    const {
      message,
      category,
    }: EventsData & {
      message?: string;
    } = data;
    setSuccessMessage('');
    setErrorMessage('');
    if (category && message) {
      if (category === NotificationCategory.Error) {
        setErrorMessage(message);
      }
      if (category === NotificationCategory.Success) {
        setSuccessMessage(message);
      }
    }
  }, [data]);

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div aria-live='assertive' className='pointer-events-none absolute inset-0 flex items-end px-4 pt-16 pb-6 sm:items-start sm:px-6 z-10'>
        <div className='flex w-full flex-col items-center space-y-4 sm:items-end'>
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition
            show={data.category !== undefined}
            as={Fragment}
            enter='transform ease-out duration-300 transition'
            enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
            enterTo='translate-y-0 opacity-100 sm:translate-x-0'
            leave='transition ease-in duration-100'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5'>
              <div className='p-4'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    {success && <CheckCircleIcon className='h-6 w-6 text-green-400' aria-hidden='true' />}
                    {error && <ExclamationTriangleIcon className='h-6 w-6 text-red-600' aria-hidden='true' />}
                  </div>
                  <div className='ml-3 w-0 flex-1 pt-0.5'>
                    <p className={`text-sm font-medium text-gray-900 ${error ? 'text-red-700 italic' : 'non-italic'}`}>{success || (error && 'Oops!')}</p>
                    {error && (
                      <div className='mt-1 text-sm text-gray-500'>
                        {error.split('\n').map(m => (
                          <div key={m} className='tracking-wide text-xs'>
                            {m.substring(0, 1).toUpperCase()}
                            {m.slice(1)}
                            {m && '.'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className='ml-4 flex flex-shrink-0'>
                    <button
                      type='button'
                      className='inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                      onClick={() => {
                        fireEvent({});
                      }}
                    >
                      <span className='sr-only'>Close</span>
                      <XMarkIcon className='h-5 w-5' aria-hidden='true' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
}
