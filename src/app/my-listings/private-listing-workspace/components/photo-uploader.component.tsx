'use client';

import { PrivateListingModel } from '@/_typings/private-listing';
import RxDropzone from '@/components/RxDropzone';
import useFormEvent, { Events, ImagePreview, PrivateListingData } from '@/hooks/useFormEvent';
import { ReactElement } from 'react';

export default function MyListingsPhotoUploaderComponent({
  children,
  listing,
  ...props
}: {
  children: ReactElement;
  className: string;
  listing?: PrivateListingModel;
}) {
  const handler = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { beds: 0, baths: 0, floor_area_uom: 'sqft', lot_uom: 'sqft' });
  return (
    <RxDropzone
      {...props}
      inputId='private-listing-photos'
      onFileUpload={(uploads: ImagePreview[]) => {
        handler.fireEvent({
          uploads: (handler.data?.uploads || []).concat(uploads),
        });
      }}
    >
      {children}
    </RxDropzone>
  );
}
