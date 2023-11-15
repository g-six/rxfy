'use client';

import SearchAddressCombobox from '@/_replacers/FilterFields/SearchAddressCombobox';
import useEvent, { Events } from '@/hooks/useEvent';
import useFormEvent, { PrivateListingData } from '@/hooks/useFormEvent';
import { ReactElement, useState } from 'react';

export default function MyListingsAddressInputComponent({
  children,
  className = '',
  placeholder = '',
  ...props
}: {
  children: ReactElement;
  className?: string;
  placeholder?: string;
  address?: string;
}) {
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { beds: 0, baths: 0, floor_area_uom: 'sqft', lot_uom: 'sqft' });

  return (
    <SearchAddressCombobox
      defaultValue={props.address || ''}
      className={className}
      placeholder={placeholder}
      name='address'
      id='address-input'
      onPlaceSelected={place => {
        fireEvent({
          ...data,
          ...place,
        });
      }}
      search={props.address || data?.title}
    />
  );
}
// 68 Smithe St
// 5br home perfect for the family with a great backyard and patio
