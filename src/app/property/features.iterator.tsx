'use client';
import { Children, ReactElement, cloneElement } from 'react';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { PageData, PropertyFeaturesWithIcons } from './type.definition';

const no_icons = ['dryer', 'other', 'front', 'open', 'wheelchair-access', 'storage'];
export default function IconIterator({ children, property, className }: { children: ReactElement; property: PageData; className: string }) {
  const { amenities, appliances, facilities, connected_services, parking, places_of_interest } = property as unknown as PropertyFeaturesWithIcons;
  const Icons: ReactElement[] = [];
  let iconables: { name: string }[] = amenities || [];

  let has_water = false;
  if (appliances?.length) iconables = iconables.concat(appliances);
  if (connected_services?.length) iconables = iconables.concat(connected_services);
  if (facilities?.length) iconables = iconables.concat(facilities);
  if (parking?.length) iconables = iconables.concat(parking);
  if (places_of_interest?.length) iconables = iconables.concat(places_of_interest);

  iconables.forEach(({ name }, idx) => {
    const key = slugifyAddress(name.toLowerCase());
    const alias = getAlias(key);
    if (alias === 'water') {
      if (!has_water) has_water = true;
      else return;
    }
    if (!no_icons.includes(key))
      Icons.push(
        <div key={`${idx}-${key}`} className={className}>
          {Children.map(children, c => {
            let icons: ReactElement[] = [];
            if (c.type === 'img') {
              return cloneElement(c, { src: `/icons/features/feature_${alias}.svg` });
            }
            return cloneElement(
              c,
              {
                key: key,
              },
              alias === 'water' ? 'Public Water Supply' : name,
            );
          })}
        </div>,
      );
  });

  return <>{Icons}</>;
}

function getAlias(feature: string) {
  if (feature.includes('water-supply')) return 'water';
  switch (feature) {
    case 'city-town-centre':
      return 'city-municipal';
    case 'dishwasher':
      return 'dish-washer';
    case 'electricity':
      return 'electricity';
    case 'double-garage':
      return 'garage-underbuilding';
    case 'microwave':
      return 'microwave-oven';
    case 'in-suite-laundry':
      return 'washing-machine';
    case 'recreational-area':
      return 'park';
    case 'shopping-mall':
      return 'shopping';
    case 'trash-removal':
      return 'disposal';
    case 'underbuilding-garage':
    case 'single-garage':
    case 'double-garage':
      return 'garage-underbuilding';
    default:
      return feature;
  }
}