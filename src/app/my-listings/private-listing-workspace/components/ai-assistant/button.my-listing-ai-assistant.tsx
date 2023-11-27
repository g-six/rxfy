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
}: {
  children: ReactElement;
  className: string;
  listing?: PrivateListingModel;
}) {
  const router = useRouter();
  const [listing, setListing] = useState(initial_listing);
  const handler = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { beds: 0, baths: 0, floor_area_uom: 'sqft', lot_uom: 'sqft' });

  const new_data = handler.data as unknown as {
    property_photo_album?: number;
    uploads: File[];
    photos: string[];
  };

  async function onSubmit() {
    const is_new = !listing?.id;
    const private_listing = listing?.id ? (listing as unknown as PrivateListingOutput) : await createPrivateListing(handler.data as PrivateListingInput);

    const upload_results = new_data.uploads
      ? await Promise.all(
          new_data.uploads.map(async (file, index) => {
            if (file.name) {
              const { upload_url } = await uploadListingPhoto(file, index + 1, private_listing);
              await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });
              const pht_url = 'https://' + new URL(upload_url).pathname.substring(1);
              new_data.uploads[index] = {
                url: pht_url,
                preview: getImageSized(pht_url, 140),
                lastModified: index,
              } as unknown as ImagePreview;
              return pht_url;
            }
          }),
        )
      : [];

    let updates: { [k: string]: unknown } & { photos?: string[]; property_photo_album?: number } = {
      property_photo_album: new_data.property_photo_album,
    };
    if (upload_results && upload_results.length) {
      updates = {
        ...updates,
        photos: new_data.photos.filter((url: string) => url.indexOf('blob:') !== 0).concat(upload_results as string[]),
      };
    }
    console.log(JSON.stringify(updates, null, 4));

    const listing_id = private_listing.id;
    if (is_new) {
      // Newly created
      handler.fireEvent(private_listing);
      router.push('/my-listings?id=' + private_listing.id);
    }

    if (Object.keys(updates).length) {
      if (listing_id) {
        const updated_listing = await updatePrivateListing(listing_id, updates);
        handler.fireEvent({
          ...updated_listing,
          uploads: [],
        });
      }
    }
  }

  useEffect(() => {
    if (new_data?.uploads) {
      const { uploads } = new_data as unknown as {
        uploads: { preview: string }[];
      };
      const photos = uploads.filter(p => p.preview).map(p => p.preview);
      setListing({
        ...listing,
        photos,
      });
    }
  }, [new_data]);

  return (
    <MyListingsNextStepButton className={className} listing={listing} data-next-step='Tab 2' beforeNext={onSubmit}>
      {children}
    </MyListingsNextStepButton>
  );
}
