import { HTMLNode } from '@/_typings/elements';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { BoltIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Element } from 'domhandler';
import Image from 'next/image';

function Icon({ icon }: { icon: string }) {
  switch (icon) {
    case 'dishwasher':
      return <BuildingStorefrontIcon className='w-12 h-12' />;
    case 'electricity':
      return <BoltIcon className='w-12 h-12' />;
    default:
      return <BuildingStorefrontIcon className='w-12 h-12' />;
  }
}
function replaceIconSlug(icon: string) {
  switch (icon) {
    case 'dishwasher':
      return 'dish-washer';
    default:
      return slugifyAddress(icon);
  }
}
export function SinglePropertyFeature(props: Record<string, string>) {
  // BLOCKER: no icon
  if (props.icon === 'dryer') return <></>;
  if (props.icon === 'baseboard') return <></>;
  if (props.icon === 'electric') return <></>;

  const heroicons = ['club house', 'city/municipal water supply', 'municipal water supply', 'electricity'];

  return (
    <div className='single-feature-block' style={{ width: 150, textAlign: 'center' }}>
      {heroicons.includes(props.icon) ? (
        <Icon icon={props.icon} />
      ) : (
        <Image alt={props.label} src={`/icons/features/feature_${replaceIconSlug(props.icon)}.svg`} width={48} height={48} />
      )}
      <div className='feature-description'>{props.label}</div>
    </div>
  );
}

export function RexifyPropertyFeatureBlock({ node, record }: { node: Element; record: PropertyDataModel | MLSProperty }) {
  if (node instanceof Element && node.attribs) {
    const RowItem = node.children.find(child => {
      const { attribs: wrapper_attribs } = child as {
        attribs: Record<string, string>;
      };

      return wrapper_attribs.class && wrapper_attribs.class.indexOf('single-feature-block') >= 0;
    }) as HTMLNode | undefined;
    if (node.attribs.class && RowItem) {
      const features: Record<string, string> = {};
      const property = record as PropertyDataModel;

      if (property.amenities?.data) {
        property.amenities.data.forEach(({ attributes }) => {
          features[attributes.name] = attributes.name.toLowerCase();
        });
      }
      if (property.appliances?.data) {
        property.appliances.data.forEach(({ attributes }) => {
          features[attributes.name] = attributes.name.toLowerCase();
        });
      }
      if (property.hvac?.data) {
        property.hvac.data.forEach(({ attributes }) => {
          features[attributes.name] = attributes.name.toLowerCase();
        });
      }
      if (property.facilities?.data) {
        property.facilities.data.forEach(({ attributes }) => {
          features[attributes.name] = attributes.name.toLowerCase();
        });
      }
      if (property.connected_services?.data) {
        property.connected_services.data.forEach(({ attributes }) => {
          if (attributes.name.toLowerCase().indexOf('water supply') >= 0) features['City/Municipal Water Supply'] = 'city/municipal water supply';
          else features[attributes.name] = attributes.name.toLowerCase();
        });
      }

      if (record.heating) {
        features['Heating'] = 'radiator';
      }
      return (
        <div className={node.attribs.class}>
          {Object.keys(features)
            .sort()
            .map((feature: string) => {
              return <SinglePropertyFeature key={features[feature]} icon={features[feature]} label={feature} />;
            })}
        </div>
      );
    }
  }
  return <></>;
}
