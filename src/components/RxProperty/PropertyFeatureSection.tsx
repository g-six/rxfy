import { HTMLNode } from '@/_typings/elements';
import { MLSProperty } from '@/_typings/property';
import { property_features } from '@/_utilities/data-helpers/property-page';
import { Element } from 'domhandler';
import Image from 'next/image';

export function SinglePropertyFeature(props: Record<string, string>) {
  return (
    <div className='single-feature-block' style={{ width: 150, textAlign: 'center' }}>
      <Image alt={props.label} src={`/icons/features/feature_${props.icon}.svg`} width={48} height={48} />
      <div className='feature-description'>{props.label}</div>
    </div>
  );
}

export function RexifyPropertyFeatureBlock({ node, record }: { node: Element; record: MLSProperty }) {
  if (node instanceof Element && node.attribs) {
    const RowItem = node.children.find(child => {
      const { attribs: wrapper_attribs } = child as {
        attribs: Record<string, string>;
      };

      return wrapper_attribs.class && wrapper_attribs.class.indexOf('single-feature-block') >= 0;
    }) as HTMLNode | undefined;
    if (node.attribs.class && RowItem) {
      const features: Record<string, string> = {};
      Object.keys(record)
        .filter((key: string) => property_features.includes(key))
        .forEach((key: string) => {
          const feature = (record[key] as string[]).join(', ');

          if (feature.toLowerCase().indexOf('air cond') >= 0) {
            features['Air Conditioning'] = 'air-conditioner';
          }
          if (feature.toLowerCase().indexOf('clthwsh/dryr') >= 0) {
            features['Washer/Dryer'] = 'washing-machine';
          }
          if (feature.toLowerCase().indexOf('frdg') >= 0) {
            features['Refrigerator'] = 'refrigerator';
          }
          if (feature.toLowerCase().indexOf('stve') >= 0) {
            features['Stove'] = 'stove';
          }
          if (feature.indexOf('DW') >= 0) {
            features['Dishwasher'] = 'dish-washer';
          }
          if (feature.toLowerCase().indexOf('concrete') >= 0) {
            features['Concrete'] = 'concrete';
          }
          if (feature.toLowerCase().indexOf('balcny') >= 0) {
            features['Balcony'] = 'balcony';
          }
          if (feature.toLowerCase().indexOf('patio') >= 0) {
            features['Patio'] = 'patio';
          }
          if (feature.indexOf('Dck') >= 0) {
            features['Deck'] = 'deck';
          }
          if (feature.toLowerCase().indexOf('torch-on') >= 0) {
            features['Torch On'] = 'torch';
          }
          if (key === 'B_WaterSupply' && feature.toLowerCase().indexOf('city/municipal') >= 0) {
            features['City/Municipal Water'] = 'city-municipal';
          }
          if (feature.indexOf('Park') >= 0) {
            features['Park'] = 'park';
          }
          if (feature.indexOf('storage') >= 0) {
            features['Storage'] = 'box';
          }
          if (feature.indexOf('recreation') >= 0) {
            features['Recreation Nearby'] = 'park';
          }
        });
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
  return <>test</>;
}
/**
 * <div className={node.attribs.class}>
            <div className={RowItem.attribs.class}>
              <div
                className={SectionTitle.firstChild.attribs.class}
              >
                {SectionTitle.firstChild.firstChild?.data}
              </div>
            </div>
            {Object.keys(stat_keys).map((key) => {
              let value = formatValues(record[key], key);

              if (group_name === 'financial') {
                switch (key) {
                  case 'L_GrossTaxes':
                    value = combineAndFormatValues({
                      L_GrossTaxes: record.L_GrossTaxes,
                      ForTaxYear: record.ForTaxYear,
                    });
                    break;
                }
              }

              return (
                <PropertyInformationRow
                  key={key}
                  wrapper_class={RowItem.attribs.class}
                  label_class={RowItem.firstChild.attribs.class}
                  value_class={RowItem.lastChild.attribs.class}
                  label={stat_keys[key] as string}
                  value={value}
                />
              );
            })}
          </div>
 */
