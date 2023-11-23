import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import { classNames } from '@/_utilities/html-helper';
import { KeyValuePair } from '@/app/api/properties/types';
import { ChangeEvent, ReactElement, useEffect, useState } from 'react';

import { Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Fragment } from 'react';
import { CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

function IconOne() {
  return (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect width='48' height='48' rx='8' fill='#FFEDD5' />
      <path d='M24 11L35.2583 17.5V30.5L24 37L12.7417 30.5V17.5L24 11Z' stroke='#FB923C' strokeWidth='2' />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M16.7417 19.8094V28.1906L24 32.3812L31.2584 28.1906V19.8094L24 15.6188L16.7417 19.8094Z'
        stroke='#FDBA74'
        strokeWidth='2'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M20.7417 22.1196V25.882L24 27.7632L27.2584 25.882V22.1196L24 20.2384L20.7417 22.1196Z'
        stroke='#FDBA74'
        strokeWidth='2'
      />
    </svg>
  );
}

function IconTwo() {
  return (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect width='48' height='48' rx='8' fill='#FFEDD5' />
      <path d='M28.0413 20L23.9998 13L19.9585 20M32.0828 27.0001L36.1242 34H28.0415M19.9585 34H11.8755L15.9171 27' stroke='#FB923C' strokeWidth='2' />
      <path fillRule='evenodd' clipRule='evenodd' d='M18.804 30H29.1963L24.0001 21L18.804 30Z' stroke='#FDBA74' strokeWidth='2' />
    </svg>
  );
}

function IconThree() {
  return (
    <svg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <rect width='48' height='48' rx='8' fill='#FFEDD5' />
      <rect x='13' y='32' width='2' height='4' fill='#FDBA74' />
      <rect x='17' y='28' width='2' height='8' fill='#FDBA74' />
      <rect x='21' y='24' width='2' height='12' fill='#FDBA74' />
      <rect x='25' y='20' width='2' height='16' fill='#FDBA74' />
      <rect x='29' y='16' width='2' height='20' fill='#FB923C' />
      <rect x='33' y='12' width='2' height='24' fill='#FB923C' />
    </svg>
  );
}

export default function MoreFieldsPopup({
  children,
  ...attr
}: {
  children: ReactElement;
  className: string;
  onChange(updates: { [k: string]: number[] }): void;
}) {
  const [relationships, setRelationships] = useState<{
    [k: string]: KeyValuePair[];
  }>();

  const [all_items, setFilteredItems] = useState<
    {
      category: string;
      id: number;
      name: string;
    }[]
  >();

  const [category, setCategory] = useState<string>('appliances');
  const [selected_items, setSelectedItems] = useState<{
    [k: string]: number[];
  }>();

  function toggleItem(item_category: string, item_id: number) {
    let selection = { ...selected_items };
    if (!selection || !selection[item_category]) {
      setSelectedItems({
        ...selected_items,
        [item_category]: [item_id],
      });
    } else {
      const index = selection[item_category].indexOf(item_id);
      if (index >= 0) {
        selection[item_category].splice(index, 1);
      } else {
        selection[item_category].push(item_id);
      }
      setSelectedItems(selection);
    }
  }

  function filterFields(name: string) {
    setFilteredItems([]);
    if (relationships) {
      if (category) setCategory('');
      const mixed_bag: { category: string; id: number; name: string }[] = [];
      Object.keys(relationships).forEach(c => {
        if (['appliances', 'hvac', 'parking', 'places_of_interest'].includes(c))
          relationships[c].forEach(x => {
            if (name && x.name.toLowerCase().includes(name.toLowerCase())) {
              mixed_bag.push({
                ...x,
                category: c,
              });
            }
          });
      });
      setFilteredItems(mixed_bag);
    }
  }

  useEffect(() => {
    selected_items && attr.onChange(selected_items);
  }, [selected_items]);

  useEffect(() => {
    getPropertyAttributes().then(results => {
      setRelationships(results);
    });
  }, []);

  return relationships ? (
    <>
      <Popover className='relative'>
        {({ open }) => (
          <>
            <Popover.Button className={classNames(attr.className, 'w-full')}>
              <span>{children}</span>
              <ChevronDownIcon
                className={`${open ? 'text-orange-300' : 'text-orange-300/70'}
                  ml-2 h-5 w-5 transition duration-150 ease-in-out group-hover:text-orange-300/80`}
                aria-hidden='true'
              />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter='transition ease-out duration-200'
              enterFrom='opacity-0 translate-y-1'
              enterTo='opacity-100 translate-y-0'
              leave='transition ease-in duration-150'
              leaveFrom='opacity-100 translate-y-0'
              leaveTo='opacity-0 translate-y-1'
            >
              <Popover.Panel className='absolute left-1/2 z-10 mt-3 w-screen max-w-sm -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-xl'>
                <div className='rounded-lg shadow-lg ring-1 ring-black/5 overflow-auto'>
                  <div className='bg-gray-50 p-4 flex flex-wrap gap-4'>
                    <button
                      type='button'
                      className={classNames(
                        category === 'appliances' ? '' : 'bg-transparent',
                        'flow-root rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500/50',
                      )}
                      onClick={() => {
                        setCategory('appliances');
                        setFilteredItems([]);
                      }}
                    >
                      <span className='flex items-center'>
                        <span className='text-sm font-medium text-gray-900'>Appliances</span>
                      </span>
                    </button>
                    <button
                      type='button'
                      className={classNames(
                        category === 'hvac' ? '' : 'bg-transparent',
                        'flow-root rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500/50',
                      )}
                      onClick={() => {
                        setCategory('hvac');
                      }}
                    >
                      <span className='flex items-center'>
                        <span className='text-sm font-medium text-gray-900'>Heating & ventilation</span>
                      </span>
                    </button>
                    <button
                      type='button'
                      className={classNames(
                        category === 'parking' ? '' : 'bg-transparent',
                        'flow-root rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500/50',
                      )}
                      onClick={() => {
                        setCategory('parking');
                      }}
                    >
                      <span className='flex items-center'>
                        <span className='text-sm font-medium text-gray-900'>Parkings</span>
                      </span>
                    </button>

                    <button
                      type='button'
                      className={classNames(
                        category === 'places_of_interest' ? '' : 'bg-transparent',
                        'flow-root rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500/50',
                      )}
                      onClick={() => {
                        setCategory('places_of_interest');
                      }}
                    >
                      <span className='flex items-center'>
                        <span className='text-sm font-medium text-gray-900'>Nearby places of Interests</span>
                      </span>
                    </button>
                  </div>
                  <div className='bg-white px-4 pt-4'>
                    <div className='relative flex items-center'>
                      <input
                        type='text'
                        name='search'
                        id='search'
                        onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                          filterFields(evt.currentTarget.value);
                        }}
                        className='block w-full rounded-md border-0 py-1.5 pl-4 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6'
                      />
                      <div className='absolute inset-y-0 right-0 flex py-1.5 pr-1.5'>
                        <span className='inline-flex items-center px-1 font-sans text-xs text-gray-400'>
                          <MagnifyingGlassIcon className='w-5 h-5' />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='relative grid gap-6 bg-white p-7 lg:grid-cols-2 max-h-60 overflow-scroll'>
                    {all_items && all_items?.length ? (
                      (all_items || []).map(item => (
                        <button
                          key={`${item.category}-${item.id}`}
                          onClick={() => {
                            toggleItem(item.category, item.id);
                          }}
                          className={classNames(
                            '-m-3 flex items-center justify-between rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-orange-500/50 cursor-pointer',
                            selected_items?.[item.category]?.includes(item.id) ? 'bg-neutral-100/10' : 'bg-transparent',
                          )}
                        >
                          <span className='text-sm font-medium text-gray-900 m-0'>{item.name}</span>
                          {selected_items?.[item.category]?.includes(item.id) ? <CheckIcon className='w-5 h-5 fill-green-500' /> : ''}
                        </button>
                      ))
                    ) : category ? (
                      relationships?.[category]?.map(item => (
                        <button
                          key={item.name}
                          onClick={() => {
                            toggleItem(category, item.id);
                          }}
                          className={classNames(
                            '-m-3 flex items-center justify-between rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-orange-500/50 cursor-pointer',
                            selected_items?.[category]?.includes(item.id) ? 'bg-neutral-100/10' : 'bg-transparent',
                          )}
                        >
                          <span className='text-sm font-medium text-gray-900 m-0'>{item.name}</span>
                          {selected_items?.[category]?.includes(item.id) ? <CheckIcon className='w-5 h-5 fill-green-500' /> : ''}
                        </button>
                      ))
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  ) : (
    <></>
  );
}
