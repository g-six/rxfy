'use client';

import { PrivateListingInput, PrivateListingModel, PrivateListingOutput } from '@/_typings/private-listing';
import useFormEvent, { Events, ImagePreview, PrivateListingData } from '@/hooks/useFormEvent';
import { ReactElement, useEffect, useState } from 'react';
import MyListingsNextStepButton from '../next-step-button.component';
import { createPrivateListing, updatePrivateListing, uploadListingPhoto } from '@/_utilities/api-calls/call-private-listings';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function MyListingAiAssistantButton({
  children,
  listing: initial_listing,
  className,
  ...props
}: {
  children: ReactElement;
  className: string;
  listing?: PrivateListingModel;
}) {
  const router = useRouter();
  const [listing, setListing] = useState(initial_listing);
  const handler = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { beds: 0, baths: 0, floor_area_uom: 'sqft', lot_uom: 'sqft' });

  const new_data = handler.data as unknown as {
    photos: File[];
  };

  async function onSubmit() {
    const private_listing = listing ? (listing as unknown as PrivateListingOutput) : await createPrivateListing(handler.data as PrivateListingInput);

    if (!listing) {
      // Newly created
      handler.fireEvent(private_listing);
      router.push('/my-listings?id=' + private_listing.id);
    }

    const uploads = new_data.photos
      ? await Promise.all(
          new_data.photos.map(async (file, index) => {
            if (file.name) {
              const { upload_url } = await uploadListingPhoto(file, index + 1, private_listing);
              await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });
              const pht_url = 'https://' + new URL(upload_url).pathname.substring(1);
              new_data.photos[index] = {
                url: pht_url,
                preview: getImageSized('https://' + new URL(upload_url).pathname.substring(1), 140),
                lastModified: index,
              } as unknown as ImagePreview;
              return pht_url;
            }
            return '';
          }),
        )
      : [];
    let has_updates = false;
    let updates: { [k: string]: unknown } = {
      photos: [],
    };
    if (listing) {
      const { photos = [] } = listing;
      updates = {
        photos,
      };
      if (uploads.filter(url => url).length) {
        updates = {
          photos: photos.concat(uploads).filter(url => url),
        };
      }
    }
    if (Object.keys(updates).length) {
      if (listing?.id) {
        const updated_listing = await updatePrivateListing(listing?.id, updates);
        handler.fireEvent({
          ...updated_listing,
        });
      }
    }
  }

  useEffect(() => {
    if (new_data?.photos) {
      const { photos } = new_data as unknown as {
        photos: { url: string }[];
      };

      setListing({
        ...listing,
        photos: photos.map(({ url }) => url),
      });
    }
  }, [new_data]);

  return (
    <MyListingsNextStepButton className={className} listing={listing} data-next-step='Tab 2' beforeNext={onSubmit}>
      {children}
    </MyListingsNextStepButton>
  );
}
