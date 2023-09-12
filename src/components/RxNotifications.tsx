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
  const [timeout, setTimer] = useState(-1);

  useEffect(() => {
    const { message, category } = data as EventsData & {
      message?: string;
    };
    setSuccessMessage('');
    setErrorMessage('');
    if (category && message) {
      if (category === NotificationCategory.ERROR) {
        setErrorMessage(message);
      }
      if (category === NotificationCategory.SUCCESS) {
        setSuccessMessage(message);
      }
    }
  }, [data]);

  useEffect(() => {
    if (data?.timeout) {
      timeout > -1 && clearTimeout(timeout);
      const t = setTimeout(() => {
        fireEvent({});
        data.onClose && data.onClose();
      }, data.timeout);
      setTimer(t as unknown as number);
    }
  }, [data]);

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div aria-live='assertive' className='pointer-events-none absolute inset-0 flex items-end px-0 sm:items-start' style={{ zIndex: 101 }}>
        <Transition
          show={data?.category !== undefined}
          as={'div'}
          enterFrom='opacity-0'
          enter='transform ease-out duration-300 transition'
          enterTo='opacity-100'
          leave='transition ease-in duration-100'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
          className='bg-black/20 w-full h-screen block fixed top-0 left-0'
        >
          <div className='pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 absolute top-1/3 left-1/2 -translate-x-1/2'>
            <div className='p-4'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  {success && <CheckCircleIcon className='h-6 w-6 text-green-500' aria-hidden='true' />}
                  {error && <ExclamationTriangleIcon className='h-6 w-6 text-red-600' aria-hidden='true' />}
                </div>
                <div className='ml-3 w-0 flex-1 pt-0.5'>
                  <p className={`mb-0 font-medium text-gray-900 ${error ? 'text-red-700 italic' : 'non-italic'}`}>{success || (error && 'Oops!')}</p>
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
                    <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </>
  );
}
