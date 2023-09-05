import { PropertyDataModel } from '@/_typings/property';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import { Children, ReactElement, cloneElement } from 'react';

function getStrapiField(key: string) {
  switch (key) {
    case 'property_address':
      return 'title';
    default:
      return key;
  }
}

function Iterator({ children, listing }: { children: ReactElement; listing: PropertyDataModel }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.['data-field']) {
      const attributes = listing as unknown as { [k: string]: string };
      const key = getStrapiField(c.props['data-field']);

      if (key === 'image_cover' && listing.cover_photo) {
        return (
          <a href={`?mls=${listing.mls_id}`}>
            {cloneElement(c, {
              srcSet: undefined,
              src: getImageSized(listing.cover_photo, 520),
            })}
          </a>
        );
      } else if (attributes[key]) {
        return cloneElement(c, {}, formatValues(attributes, key) + (key.includes('floor_area') ? ' sqft.' : ''));
      }
    }
    if (c.type === 'div' && c.props.children) {
      return (
        <div {...c.props}>
          <Iterator listing={listing}>{c.props.children}</Iterator>
        </div>
      );
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default function AlicantePropcard({ children, listing }: { children: ReactElement; listing: PropertyDataModel }) {
  return (
    <>
      <Iterator listing={listing}>{children}</Iterator>
    </>
  );
}
