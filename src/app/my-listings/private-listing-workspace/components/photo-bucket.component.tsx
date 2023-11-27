'use client';

import { PrivateListingModel } from '@/_typings/private-listing';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

import useFormEvent, { Events, ImagePreview, PrivateListingData } from '@/hooks/useFormEvent';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { MyListingPhotoBucketItem } from './photo-item.component';

interface Props {
  children: ReactElement;
  className: string;
  listing?: PrivateListingModel;
  uploads?: string[];
}

function Rexify({ children, ...component_props }: Props & { photos: string[]; onRemove(url: string): void }) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { children: components, className = '', ...props } = c.props;
      className = `${className}${className && ' '}rexified`;

      if (components && typeof components !== 'string') {
        if (className.includes('card-upload-icon')) {
          let photo_urls = component_props.photos || [];
          if (component_props.uploads) {
            photo_urls = photo_urls.concat(component_props.uploads);
          }
          return photo_urls.length ? (
            <>
              {photo_urls.map((url, index) => {
                if (url) {
                  return (
                    <MyListingPhotoBucketItem
                      key={`${index + 1}/${url}`}
                      className={className}
                      position={index + 1}
                      url={url.indexOf('blob:') === 0 ? url : getImageSized(url, 160)}
                      onRemove={() => {
                        component_props.onRemove(url);
                      }}
                    >
                      {components}
                    </MyListingPhotoBucketItem>
                  );
                }
              })}
            </>
          ) : (
            <></>
          );
        }

        return cloneElement(c, { className }, <Rexify {...component_props}>{components}</Rexify>);
      } else if (className.includes('card-upload-icon')) return <></>;
    }

    return c;
  });

  return <>{Rexified}</>;
}

export default function MyListingsPhotoBucketComponent({ children, listing: initial_listing, ...props }: Props) {
  const [is_mounted, mountComponent] = useState(false);
  const handler = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { beds: 0, baths: 0, floor_area_uom: 'sqft', lot_uom: 'sqft' });
  const [bucket, setPhotoBucketData] = useState<{
    property_photo_album?: number;
    photos: string[];
    uploads: File[];
  }>({
    uploads: handler.data?.uploads || [],
    photos: handler.data?.photos || [],
    property_photo_album: initial_listing?.property_photo_album,
  });

  function getUploadPreviewUrl(file: File) {
    const { preview } = file as unknown as { preview?: string };
    return preview || '';
  }

  function onRemove(url: string) {
    const photos = [...bucket.photos];
    const uploads = [...bucket.uploads];
    const photo_index = photos.indexOf(url);

    if (photo_index >= 0) {
      photos.splice(photo_index, 1);
      // If the removed item was a File
      if (url.indexOf('blob:') === 0) {
        uploads.forEach((upload: File, upload_idx) => {
          const preview = getUploadPreviewUrl(upload);
          if (preview && preview === url) uploads.splice(upload_idx, 1);
        });
      } else if (url) {
        photos.forEach((photo: string, upload_idx) => {
          if (photo === url) uploads.splice(upload_idx, 1);
        });
        handler.fireEvent({ photos });
      }
    }
    setPhotoBucketData({
      ...bucket,
      photos,
      uploads,
    });
  }

  useEffect(() => {
    if (is_mounted) {
      setPhotoBucketData({
        property_photo_album: initial_listing?.property_photo_album,
        photos: handler.data?.photos || [],
        uploads: handler.data?.uploads || [],
      });
    }
  }, [is_mounted, handler.data?.photos, handler.data?.uploads]);

  useEffect(() => {
    mountComponent(true);
  }, []);

  return bucket.photos.length || bucket.uploads.length ? (
    <div {...props}>
      {is_mounted && (
        <Rexify {...props} photos={bucket.photos} uploads={bucket.uploads.map(getUploadPreviewUrl)} onRemove={onRemove}>
          {children}
        </Rexify>
      )}
    </div>
  ) : (
    <></>
  );
}
