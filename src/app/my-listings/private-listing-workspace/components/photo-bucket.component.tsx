'use client';

import { PrivateListingModel } from '@/_typings/private-listing';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import useFormEvent, { Events, ImagePreview, PrivateListingData } from '@/hooks/useFormEvent';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { MyListingPhotoBucketItem } from './photo-item.component';

interface Props {
  children: ReactElement;
  className: string;
  listing?: PrivateListingModel;
}
function Rexify({ children, ...component_props }: Props & { photos: string[]; onRemove(url: string): void }) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { children: components, className = '', ...props } = c.props;
      className = `${className}${className && ' '}rexified`;

      if (components && typeof components !== 'string') {
        if (className.includes('card-upload-icon')) {
          return component_props.photos ? (
            <>
              {component_props.photos.map((pht, index) => {
                if (pht) {
                  return (
                    <MyListingPhotoBucketItem
                      key={`${index + 1}/${pht}`}
                      className={className}
                      position={index + 1}
                      url={pht.indexOf('blob:') === 0 ? pht : getImageSized(pht, 160)}
                      onRemove={() => {
                        component_props.onRemove(pht);
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
  const [listing, setListing] = useState<PrivateListingModel | undefined>(initial_listing);
  const handler = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { beds: 0, baths: 0, floor_area_uom: 'sqft', lot_uom: 'sqft' });
  const data = handler.data as unknown as {
    photos: string[];
    uploads?: ImagePreview[];
  };

  function onRemove(url: string) {
    const uploads = data.uploads || [];
    let updated = [...data.photos];
    const index = updated.indexOf(url);

    updated.splice(index, 1);
    updated = updated.filter(url => url);
    uploads.forEach((upload, upload_idx) => {
      if (upload.url && upload.url === url) uploads.splice(upload_idx, 1);
    });

    handler.fireEvent({
      uploads,
    });
  }

  useEffect(() => {
    mountComponent(true);
  }, []);

  console.log(data.photos);

  return data.photos?.length ? (
    <div {...props}>
      {is_mounted && (
        <Rexify {...props} photos={data.photos} onRemove={onRemove}>
          {children}
        </Rexify>
      )}
    </div>
  ) : (
    <></>
  );
}
