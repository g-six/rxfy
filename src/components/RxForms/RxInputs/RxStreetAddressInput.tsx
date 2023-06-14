/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { SelectedPlaceDetails } from '@/_typings/maps';
import { getPlaceDetails, queryPlace } from '@/_utilities/api-calls/call-places';
import { classNames } from '@/_utilities/html-helper';
import useDebounce from '@/hooks/useDebounce';
import { Combobox } from '@headlessui/react';
import { CheckIcon, MapPinIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import React from 'react';

type Props = {
  id: string;
  name: string;
  className?: string;
  type: React.ElementType;
  placeholder?: string;
  multiple?: boolean;
  biased_to?: string;
  onSelect?: (selection: SelectedPlaceDetails) => void;
};

type Suggestion = {
  place_id: string;
  suggestion: string;
};

export default function RxStreetAddressInput(p: Props) {
  const [address, setAddress] = React.useState('');
  const [choices, setChoices] = React.useState<Suggestion[]>([]);
  const [selected, setSelection] = React.useState<Suggestion>();
  const [show_loader, showLoader] = React.useState(false);
  const debounced_address = useDebounce(address, 1000);

  React.useEffect(() => {
    if (selected?.place_id) {
      getPlaceDetails(selected.place_id).then((place: SelectedPlaceDetails) => {
        let short_address = selected?.suggestion || '';
        if (short_address) short_address = short_address.split(',').reverse().pop() as string;
        if (p.onSelect)
          p.onSelect({
            ...place,
            short_address: short_address,
          });
        else console.log('No handler set for RxStreetAddressInput selection', selected);
      });
    }
  }, [selected]);

  React.useEffect(() => {
    if (debounced_address.length > 2) {
      queryPlace(debounced_address)
        .then(setChoices)
        .finally(() => {
          showLoader(false);
        });
    }
  }, [debounced_address]);

  return (
    <Combobox
      as='div'
      className='flex-1 w-full'
      onChange={(selection: Suggestion) => {
        showLoader(false);
        setSelection(selection);
      }}
    >
      <div className='relative w-full'>
        <Combobox.Input
          className={p.className}
          autoComplete='no'
          placeholder={p.placeholder}
          displayValue={(v?: { suggestion: string }) => (p.multiple ? '' : v?.suggestion || address)}
          onChange={(elem: React.ChangeEvent<HTMLInputElement>) => {
            if (elem.currentTarget.value.length > 2 && p.biased_to) {
              setAddress([elem.currentTarget.value, p.biased_to].join(', '));
            } else setAddress(elem.currentTarget.value);
            showLoader(elem.currentTarget.value.length > 2);
          }}
        />

        {show_loader && <Image alt='loading' src='/loading.gif' width={16} height={16} className='absolute top-1/2 right-2 -translate-y-1/2' />}

        {choices && choices.length > 0 && (
          <Combobox.Options className='absolute px-0 z-[999] -left-2 mt-2 max-h-56 overflow-y-auto w-96 rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'>
            {choices.map((suggestion: Suggestion) => (
              <Combobox.Option
                key={suggestion.place_id}
                value={suggestion}
                className={({ active }) =>
                  classNames('relative cursor-default select-none py-2 pl-3 pr-2 flex items-center', active ? 'bg-indigo-600 text-white' : 'text-gray-900')
                }
              >
                {({ active, selected }) => (
                  <>
                    <MapPinIcon
                      className={classNames('h-4 w-4 flex-shrink-0 rounded-full', selected ? 'fill-indigo-600' : active ? 'fill-slate-100' : 'fill-slate-400')}
                    />
                    <span className={classNames('ml-3 truncate', selected && 'font-semibold')}>
                      {p.biased_to ? suggestion?.suggestion.split(',').reverse().pop() : suggestion?.suggestion || address}
                    </span>

                    {selected && (
                      <span className={classNames('absolute inset-y-0 right-0 flex items-center pr-4', active ? 'text-white' : 'text-indigo-600')}>
                        <CheckIcon className='h-5 w-5' aria-hidden='true' />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}
