'use client';
import { classNames } from '@/_utilities/html-helper';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { Children, Fragment, ReactElement, cloneElement, useEffect, useState } from 'react';

interface Props {
  children: ReactElement;
  'field-name': string;
  className?: string;
  onSelect(selection: { id: number; name: string }): void;
  defaultValue?: {
    id: number;
    name: string;
  };
  show?: boolean;
  options?: {
    id: number;
    name: string;
  }[];
}

function RexifiedList(p: { query: string; setQuery(s: string): void; children: { id: number; name: string }[] }) {
  const filtered = !p.query
    ? p.children || []
    : (p.children || []).filter(o => o.name.toLowerCase().replace(/\s+/g, '').includes(p.query.toLowerCase().replace(/\s+/g, '')));

  return (
    <Transition
      as={Fragment}
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
      afterLeave={() => {
        p.setQuery('');
      }}
    >
      <Combobox.Options className='absolute mt-1 z-10 max-h-60 w-full overflow-auto rounded-md bg-white p-0 text-base ring-1 ring-black/5 focus:outline-none sm:text-sm border-neutral-100 shadow-2xl'>
        {filtered.length === 0 && p.query !== '' ? (
          <div className='relative cursor-default select-none py-2 px-4 text-gray-700'>Nothing found.</div>
        ) : (
          filtered.map(option => (
            <Combobox.Option
              key={option.id}
              className={({ active }) => `relative cursor-default select-none py-2 px-4 ${active ? 'bg-indigo-600 text-white' : ''}`}
              value={option}
            >
              {({ selected, active }) => (
                <>
                  <span data-id={option.id} className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                    {option.name}
                  </span>
                </>
              )}
            </Combobox.Option>
          ))
        )}
      </Combobox.Options>
    </Transition>
  );
}

function RexifiedToggle({ children, setQuery }: { children: ReactElement; setQuery(s: string): void }) {
  return (
    <>
      {Children.map(children, c => {
        return c.props?.className?.includes('icon') ? (
          <Combobox.Button key={c.props.className} className='bg-transparent absolute right-0 rounded-2xl h-full aspect-square'>
            <span className={c.props?.className}>{c.props.children}</span>
          </Combobox.Button>
        ) : (
          <Combobox.Input
            key='input'
            className={`w-full border-none focus:ring-0 outline-none ring-0 ${c.props?.className || ''}`}
            displayValue={(selection?: { name: string }) => selection?.name || ''}
            onChange={event => setQuery(event.target.value)}
            placeholder={c.props.children as string}
          />
        );
      })}
    </>
  );
}

function Rexify({ children, ...attributes }: Props & { query: string; setQuery(s: string): void }) {
  const Rexified = Children.map(children, c => {
    if (c.props && c.props.children) {
      let className = c.props.className || '';
      className = `rexified ${className}`.trim();

      if (typeof c.props.children !== 'string') {
        if (className.includes('list')) {
          return <RexifiedList {...attributes}>{attributes.options || []}</RexifiedList>;
        }
        if (className.includes('toggle')) {
          return cloneElement(c, { className: `${className} relative` }, <RexifiedToggle {...attributes}>{c.props.children}</RexifiedToggle>);
        }
        return cloneElement(
          c,
          {},
          <Rexify {...attributes} className={className}>
            {c.props.children}
          </Rexify>,
        );
      }
    }
    return c;
  });

  return <>{Rexified}</>;
}

export default function InputDropdown({ children, defaultValue, ...props }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelection] = useState<{ id: number; name: string } | undefined>(defaultValue);

  // rexifyOptions(children, v => {
  //   if (!options.filter(kv => kv.name.toLowerCase() === v[0].toLowerCase()).length)
  //     options.push({
  //       name: v[1],
  //       id: v[0],
  //     });
  // });

  useEffect(() => {
    selected && props.onSelect(selected);
  }, [selected]);

  return (
    <div rx-field-name={props['field-name']} className='relative'>
      <Combobox value={selected} onChange={setSelection} nullable>
        <Rexify {...props} setQuery={setQuery} query={query}>
          {children}
        </Rexify>
      </Combobox>
    </div>
  );
}
