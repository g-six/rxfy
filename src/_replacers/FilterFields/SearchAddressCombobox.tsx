'use client';
import { useEffect, useState } from 'react';

import { CheckIcon, MapPinIcon } from '@heroicons/react/20/solid';
import { Combobox } from '@headlessui/react';
import { classNames } from '@/_utilities/html-helper';

import useDebounce from '@/hooks/useDebounce';
import { queryPlace, getPlaceDetails } from '@/_utilities/api-calls/call-places';

export type SearchInputProps = {
  name: string;
  id: string;
  placeholder?: string;
  className?: string;
  onPlaceSelected(place: any): void;
  search?: string;
};
interface SuggestionInterface {
  suggestion: string;
  place_id: string;
}
export default function SearchAddressCombobox(p: SearchInputProps) {
  const [address, setAddressQuery] = useState(p.search ?? '');
  const debounced = useDebounce(address ?? '', 900);
  const [suggestions, setSuggestions] = useState<SuggestionInterface[]>([]);
  const [selectedAddressData, setSelectedAddressData] = useState<any>();

  useEffect(() => {
    if (debounced.length > 4) {
      queryPlace(debounced).then(res => {
        setSuggestions(res);
      });
    }
  }, [debounced]);

  return (
    <Combobox
      nullable
      as='div'
      value={selectedAddressData?.address ?? null}
      onChange={(value: any) => {
        getPlaceDetails(value.place_id).then(res => {
          setSelectedAddressData(res);
          p.onPlaceSelected(Object.assign({}, res, { search: address }));
        });
      }}
      className='flex-1 w-full'
    >
      <div className='relative w-full'>
        <Combobox.Input
          placeholder={p.placeholder}
          className={[p.className, 'pr-10'].join(' ')}
          autoComplete='off'
          onChange={e => {
            setAddressQuery(e.target.value);
          }}
          displayValue={(addressData: any) => {
            return addressData;
          }}
        />

        {suggestions && suggestions.length > 0 && (
          <Combobox.Options className='absolute px-0 z-[999] left-0 w-full mt-2 max-h-56 overflow-y-auto  rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'>
            {suggestions.map((suggestion: SuggestionInterface) => (
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
                    <span className={classNames('ml-3 truncate', selected && 'font-semibold')}>{suggestion?.suggestion || address}</span>

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
