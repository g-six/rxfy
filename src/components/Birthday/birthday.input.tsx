import { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';
import styles from './birthday.module.scss';
import { classNames } from '@/_utilities/html-helper';
const people = [
  { name: 'Wade Cooper' },
  { name: 'Arlene Mccoy' },
  { name: 'Devon Webb' },
  { name: 'Tom Cook' },
  { name: 'Tanya Fox' },
  { name: 'Hellen Schmidt' },
];
const months = [
  { name: 'Jan' },
  { name: 'Feb' },
  { name: 'Mar' },
  { name: 'Apr' },
  { name: 'May' },
  { name: 'Jun' },
  { name: 'Jul' },
  { name: 'Aug' },
  { name: 'Sep' },
  { name: 'Oct' },
  { name: 'Nov' },
  { name: 'Dec' },
];

function formatDate(dt: Date = new Date()) {
  return dt.toISOString().split('T')[0];
}
export default function BirthdayInput({
  className,
  defaultValue,
  ...props
}: {
  className: string;
  defaultValue: string;
  onChange(formatted_date: string): void;
}) {
  const [days, setDays] = useState(Array.from({ length: 31 }, (v, i) => i + 1));
  const [date, setDate] = useState(new Date());
  const [selected_date, setSelectedDate] = useState(defaultValue || formatDate());

  function adjustDate(value: number = 0, part = '') {
    let v = formatDate();
    const [year, month, day] = selected_date.split('-').map(Number);
    switch (part) {
      case 'day':
        v = formatDate(new Date(year, month - 1, value));
        break;
      case 'month':
        v = formatDate(new Date(year, value, day));
        break;
      case 'year':
        v = formatDate(new Date(value, month - 1, day));
        break;
    }
    setSelectedDate(v);
    props.onChange(v);
    return v;
  }

  return (
    <div className={classNames(className, styles.wrapper)}>
      <div className='flex gap-0.5'>
        <Listbox value={selected_date.split('-').map(Number).pop()} onChange={d => adjustDate(d, 'day')}>
          <div className='relative'>
            <Listbox.Button className='relative w-[72px] cursor-default rounded-l-lg bg-white py-2 pl-3 pr-6 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300'>
              <span className='block truncate'>{selected_date.split('-').pop()}</span>
              <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <ChevronUpDownIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
              </span>
            </Listbox.Button>
            <Transition as={Fragment} leave='transition ease-in duration-100' leaveFrom='opacity-100' leaveTo='opacity-0'>
              <Listbox.Options className='absolute px-1 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm'>
                {days.map(num => (
                  <Listbox.Option
                    key={num}
                    className={({ active }) =>
                      `relative cursor-default select-none p-2 text-left ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600'}`
                    }
                    value={num}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{num}</span>
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
        <Listbox value={months[selected_date.split('-').map(Number)[1] - 1]} onChange={d => adjustDate(months.indexOf(d), 'month')}>
          <div className='relative flex-1'>
            <Listbox.Button className='relative w-full cursor-default bg-white py-2 pl-3 pr-6 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm'>
              <span className='block truncate'>{months[selected_date.split('-').map(Number)[1] - 1].name}</span>
              <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <ChevronUpDownIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
              </span>
            </Listbox.Button>
            <Transition as={Fragment} leave='transition ease-in duration-100' leaveFrom='opacity-100' leaveTo='opacity-0'>
              <Listbox.Options className='absolute px-1 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none'>
                {months.map((item, monthIdx) => (
                  <Listbox.Option
                    key={monthIdx}
                    className={({ active }) =>
                      `relative cursor-default select-none p-2 text-left ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-500'}`
                    }
                    value={item}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : ''}`}>{item.name}</span>
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
        <Listbox value={date.getFullYear()} onChange={d => adjustDate(d, 'year')}>
          <div className='relative'>
            <Listbox.Button className='relative w-[88px] cursor-default rounded-r-lg bg-white py-2 pl-3 pr-6 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300'>
              <span className='block truncate'>{selected_date.split('-').map(Number).reverse().pop()}</span>
              <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <ChevronUpDownIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
              </span>
            </Listbox.Button>
            <Transition as={Fragment} leave='transition ease-in duration-100' leaveFrom='opacity-100' leaveTo='opacity-0'>
              <Listbox.Options className='absolute px-1 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none text-xs'>
                {Array.from({ length: 70 }, (v, i) => new Date().getFullYear() - i - 16).map(num => (
                  <Listbox.Option
                    key={num}
                    className={({ active }) =>
                      `relative cursor-default select-none p-2 text-left ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600'}`
                    }
                    value={num}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : ''}`}>{num}</span>
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>
    </div>
  );
}
