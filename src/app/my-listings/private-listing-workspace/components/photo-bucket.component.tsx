'use client';

import { PrivateListingModel } from '@/_typings/private-listing';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { MyListingPhotoBucketItem } from './photo-item.component';

interface Props {
  children: ReactElement;
  className: string;
  listing?: PrivateListingModel;
}
function Rexify({ children, ...component_props }: Props & { photos?: { file?: File; url: string }[]; onRemove(index: number): void }) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { children: components, className = '', ...props } = c.props;
      className = `${className}${className && ' '}rexified`;

      if (components && typeof components !== 'string') {
        if (className.includes('card-upload-icon')) {
          return component_props.photos ? (
            <>
              {component_props.photos.map((pht, index) => {
                if (pht.url) {
                  return (
                    <MyListingPhotoBucketItem
                      key={pht.url}
                      className={className}
                      position={index + 1}
                      url={pht.file ? pht.url : getImageSized(pht.url, 160)}
                      onRemove={() => {
                        component_props.onRemove(index);
                      }}
                    >
                      {components}
                    </MyListingPhotoBucketItem>
                  );
                  return cloneElement(
                    c,
                    {
                      key: pht.url,
                      className: classNames(className, 'bg-no-repeat bg-cover bg-center'),
                      style: {
                        backgroundImage: `url(${pht.file ? pht.url : getImageSized(pht.url, 160)})`,
                      },
                    },
                    <Rexify {...component_props}>{components}</Rexify>,
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
  const [photos, setPhotos] = useState<{ file?: File; url: string }[]>([]);
  const handler = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { beds: 0, baths: 0, floor_area_uom: 'sqft', lot_uom: 'sqft' });

  const data = handler.data as unknown as {
    photos?: File[];
  };

  function onRemove(index: number) {
    photos.splice(index, 1);
    handler.fireEvent({
      photos,
    } as unknown as PrivateListingData);
    setPhotos(photos);
  }

  useEffect(() => {
    if (photos) {
      setListing({
        ...listing,
        photos: photos.map(p => p.url),
      });
    }
  }, [photos]);

  useEffect(() => {
    if (data.photos?.length) {
      const files = data.photos.map(file => {
        const { preview } = file as unknown as {
          preview: string;
        };
        return {
          file,
          url: preview ? preview : '',
        };
      });
      setPhotos(photos.concat(files));
    }
  }, [data.photos]);

  useEffect(() => {
    mountComponent(true);
    if (listing?.photos) {
      setPhotos(
        listing.photos.map(url => ({
          url,
        })),
      );
    }
  }, []);

  return (
    <div {...props}>
      {is_mounted && (
        <Rexify {...props} photos={photos as { file?: File; url: string }[]} onRemove={onRemove}>
          {children}
        </Rexify>
      )}
    </div>
  );
}
