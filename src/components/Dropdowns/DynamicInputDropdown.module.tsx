'use client';
import { ChangeEventHandler, Fragment, useEffect, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { classNames } from '@/_utilities/html-helper';

export default function DynamicInputDropdown({
  onSelect,
  options,
  direction = 'down',
}: {
  onSelect({ id, name }: { id: number; name: string }): void;
  options: { id: number; name: string }[];
  direction?: 'up' | 'down';
}) {
  const [selected, setSelected] = useState(options[0]);
  const [query, setQuery] = useState('');

  const filtered =
    query === '' ? options : options.filter(option => option.name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, '')));

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  return (
    <div className='w-full'>
      <Combobox value={selected} onChange={setSelected}>
        <div className='relative mt-1'>
          <div className='relative border border-slate-200 w-full cursor-default overflow-hidden rounded-lg bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm'>
            <Combobox.Input
              className='w-full border-none py-3.5 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0'
              displayValue={(option: { id: number; name: string }) => option.name}
              onChange={event => setQuery(event.target.value)}
            />
            <Combobox.Button className='bg-transparent absolute inset-y-0 right-0 flex items-center pr-2'>
              <ChevronUpDownIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
            </Combobox.Button>
          </div>
          <Transition as={Fragment} leave='transition ease-in duration-100' leaveFrom='opacity-100' leaveTo='opacity-0' afterLeave={() => setQuery('')}>
            <Combobox.Options
              className={classNames(
                direction === 'up' ? 'bottom-8' : '',
                'absolute pl-0 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm',
              )}
            >
              {filtered.length === 0 && query !== '' ? (
                <div className='relative cursor-default select-none px-4 py-2 text-gray-700'>Nothing found.</div>
              ) : (
                filtered.map(option => (
                  <Combobox.Option
                    key={option.id}
                    className={({ active }) => `relative cursor-default select-none py-3 pl-10 pr-4 ${active ? 'bg-teal-600 text-white' : 'text-gray-900'}`}
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.name}</span>
                        {selected ? (
                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-teal-600'}`}>
                            <CheckIcon className='h-5 w-5' aria-hidden='true' />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}
