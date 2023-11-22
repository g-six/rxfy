'use client';
import React, { ReactElement, cloneElement } from 'react';
import { BathroomDetails, LovedPropertyDataModel, PropertyDataModel, RoomDetails } from '@/_typings/property';
import useEvent, { Events } from '@/hooks/useEvent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import RxPropertyMaps from '@/components/RxProperty/RxPropertyMaps';
import RxPropertyStats from '@/components/RxProperty/RxPropertyStats';
import { AgentData } from '@/_typings/agent';
import styles from './CustomerPropertyView.module.scss';
import RxActionBar from './CRMPropertyPageComponents/RxActionBar';
import RxFeatures from '@/components/RxProperty/RxFeatures';
import { getFeatureIcons } from '@/_helpers/functions';
import { retrievePublicListingsFromPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import KeyValueIterator from '@/app/property/key-value-pair.iterator';
import { construction_kv, financial_kv, property_info_kv } from '@/app/property/type.definition';
import RxMapOfListing from '@/components/RxMapOfListing';

type Props = {
  children: React.ReactElement;
  id?: string;
  agent?: AgentData;
  property?: PropertyDataModel | LovedPropertyDataModel;
  neighbours?: PropertyDataModel[];
  className?: string;
  reload: (r: unknown) => void;
};

function OtherUnits({ children, neighbours }: { children: React.ReactElement; neighbours: PropertyDataModel[] }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children: sub, ...props } = c.props;

      if (props.className?.includes('div-building-units-on-sale')) {
        return <></>;
      }

      return (
        <div {...props}>
          <OtherUnits neighbours={neighbours}>{sub}</OtherUnits>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

function PhotoComponentsIterator(p: { 'data-field': string; photos: string[]; children: ReactElement }) {
  switch (p['data-field']) {
    case 'image_1':
      return React.cloneElement(
        p.children,
        {
          style: p.photos[0]
            ? {
                backgroundImage: `url(${getImageSized(p.photos[0], 780)})`,
              }
            : {},
        },
        p.photos.length > 0 ? <></> : p.children.props.children,
      );
    case 'image_2':
      if (p.photos.length > 1)
        return React.cloneElement(
          p.children,
          {
            style: {
              backgroundImage: `url(${getImageSized(p.photos[1], 580)})`,
            },
          },
          p.photos.length > 1 ? <></> : p.children.props.children,
        );
    case 'image_3':
      if (p.photos.length > 2)
        return React.cloneElement(
          p.children,
          {
            style: {
              backgroundImage: `url(${getImageSized(p.photos[2], 580)})`,
            },
          },
          p.photos.length > 2 ? <></> : p.children.props.children,
        );
    default:
      const photo_number = Number(p['data-field'].split('_').pop());
      if (p.photos.length >= photo_number)
        return React.cloneElement(
          p.children,
          {
            style: {
              backgroundImage: `url(${getImageSized(p.photos[photo_number - 1], 360)})`,
            },
          },
          p.photos.length >= photo_number ? <></> : p.children.props.children,
        );
  }
}

function RoomsIterator(p: { children: ReactElement; rooms: RoomDetails[]; className?: string }) {
  const dimensions: ReactElement[] = [];
  p.rooms
    .filter(room => room.type?.toLowerCase() !== 'bedroom' && room.type?.toLowerCase().includes('bed'))
    .map((k, idx) => (
      <KeyValueIterator
        label={k.type}
        value={`${k.width} x ${k.length}`}
        key={`${k.type} ${k.level} ${k.width} x ${k.length} ${idx}`}
        className={p.className || 'no-default-class'}
      >
        {p.children}
      </KeyValueIterator>
    ))
    .concat(
      p.rooms
        .filter(room => room.type?.toLowerCase() === 'bedroom')
        .map((k, idx) => (
          <KeyValueIterator
            label={k.type}
            value={`${k.width} x ${k.length}`}
            key={`${k.type} ${k.level} ${k.width} x ${k.length} ${idx}`}
            className={p.className || 'no-default-class'}
          >
            {p.children}
          </KeyValueIterator>
        )),
    )
    .forEach(r => dimensions.push(r));

  return dimensions;
}

function BathsIterator(p: { children: ReactElement; baths: BathroomDetails[]; className?: string }) {
  const dimensions: ReactElement[] = [];
  p.baths
    .filter(bath => bath.ensuite?.toLowerCase() === 'yes')
    .map((k, idx) => (
      <KeyValueIterator
        label={`Ensuite bath ${idx + 1} (${k.level} floor)`}
        value={`${k.pieces}-pc`}
        key={`bath-${idx + 1}`}
        className={p.className || 'no-default-class'}
      >
        {p.children}
      </KeyValueIterator>
    ))
    .forEach(r => dimensions.push(r));

  return dimensions;
}

function Iterator(p: Props & { property?: PropertyDataModel }) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.children || child.props?.className) {
      if (child.props['data-action'] === 'find_homes') {
        return <></>;
      } else if (child.type === 'div') {
        if (child.props.className?.includes('similar-')) {
          return <></>;
        }
        if (child.props['data-field'] && child.props['data-field'] !== 'image_cover') {
          console.log('data-field', child.props['data-field']);
          if (child.props['data-field'].includes('image_') && !isNaN(Number(child.props['data-field'].split('_').pop())) && p.property?.photos?.length)
            return (
              <PhotoComponentsIterator photos={p.property.photos} {...child.props}>
                {child}
              </PhotoComponentsIterator>
            );
          else {
            const value = formatValues(p.property, child.props['data-field']);
            if (value) return cloneElement(child, {}, value);
            else {
              if (['lot_sqft', 'lot_sqm'].includes(child.props['data-field'])) {
                switch (child.props['data-field']) {
                  case 'lot_sqft':
                    if (p.property?.lot_sqm) return cloneElement(child, {}, formatValues(p.property, 'lot_sqm') + ' sqm');
                  default:
                    if (p.property?.lot_sqft) return cloneElement(child, {}, formatValues(p.property, 'lot_sqft'));
                }
              } else if (['property_info', 'financial_info', 'construction_info'].includes(child.props['data-field'])) {
                const data = p.property as unknown as { [key: string]: string };

                let key_value_pair = property_info_kv;
                if (child.props['data-field'] === 'financial_info') key_value_pair = financial_kv;
                if (child.props['data-field'] === 'construction_info') key_value_pair = construction_kv;

                return Object.keys(data)
                  .filter(k => key_value_pair[k])
                  .map(k => (
                    <KeyValueIterator key={k} className={child.props.className} label={key_value_pair[k]} value={formatValues(p.property, k)}>
                      {child.props.children}
                    </KeyValueIterator>
                  ));
              } else if (child.props['data-field'] === 'dimensions_info') {
                let Rooms: React.JSX.Element = <></>;
                if (p.property?.room_details) {
                  const { rooms } = p.property.room_details as unknown as {
                    rooms: RoomDetails[];
                  };
                  Rooms = (
                    <RoomsIterator rooms={rooms} className={child.props.className}>
                      {child.props.children}
                    </RoomsIterator>
                  );
                }

                let Baths: React.JSX.Element = <></>;
                if (p.property?.bathroom_details) {
                  const { baths } = p.property.bathroom_details as unknown as {
                    baths: BathroomDetails[];
                  };
                  Baths = (
                    <BathsIterator baths={baths} className={child.props.className}>
                      {child.props.children}
                    </BathsIterator>
                  );
                }
                return (
                  <>
                    {Rooms}
                    {Baths}
                  </>
                );
              }
              return <></>;
            }
          }
        } else if (typeof child.props.children === 'string') {
          if (child.props['data-field'] === 'sqft') {
            return React.cloneElement(child, {
              children: new Intl.NumberFormat().format(p.property?.floor_area || p.property?.floor_area_total || p.property?.floor_area_main || 0) || 'N/A',
            });
          }
          switch (child.props.children) {
            case '{Price}':
              return React.cloneElement(child, {
                children: p.property?.asking_price ? '$' + new Intl.NumberFormat().format(p.property.asking_price) : 'N.A.',
              });
            case '{Address}':
              return React.cloneElement(child, {
                children: p.property?.title,
              });
            case '{Area}':
              return React.cloneElement(child, {
                children: p.property?.subarea_community || p.property?.area,
              });
            case '{Beds}':
              return React.cloneElement(child, {
                children: p.property?.beds || 'N/A',
              });
            case '{Baths}':
              return React.cloneElement(child, {
                children: p.property?.baths || 'N/A',
              });
            case '{Description}':
              return p.property?.description ? (
                React.cloneElement(child, {
                  children: p.property?.description,
                })
              ) : (
                <></>
              );
            case '{Year Built}':
              return React.cloneElement(child, {
                children: p.property?.year_built || 'N/A',
              });
            case '{Sqft}':
              return React.cloneElement(child, {
                children: new Intl.NumberFormat().format(p.property?.floor_area_total || p.property?.floor_area_main || 0) || 'N/A',
              });
            case '{Listing By}':
              return p.property?.listing_by ? (
                React.cloneElement(child, {
                  children: p.property?.listing_by,
                })
              ) : (
                <></>
              );
            case '{MLS Number}':
              return React.cloneElement(child, {
                children: p.property?.mls_id || 'N/A',
              });
            case '{Land Title}':
              return React.cloneElement(child, {
                children: p.property?.land_title || 'N/A',
              });
            case '{Price Per Sqft}':
              return React.cloneElement(child, {
                children: p.property?.price_per_sqft ? `$${p.property.price_per_sqft}` : 'N/A',
              });
            case '{Property Tax}':
              return React.cloneElement(child, {
                children: (() => {
                  let ret = 'N/A';
                  if (p.property?.gross_taxes) {
                    ret = '$' + new Intl.NumberFormat().format(p.property.gross_taxes) + ' ';
                  }
                  if (p.property?.tax_year) {
                    ret = `${ret} (${p.property.tax_year})`;
                  }
                  return ret;
                })(),
              });
            case '{Building Type}':
              return React.cloneElement(child, {
                children: p.property?.building_type || p.property?.property_type || p.property?.style_type || 'N/A',
              });
            case '{Lot Size}':
              return React.cloneElement(child, {
                children: (() => {
                  if (p.property?.lot_sqft) {
                    return new Intl.NumberFormat().format(p.property.lot_sqft) + 'sqft';
                  }
                  if (p.property?.lot_sqm) {
                    return new Intl.NumberFormat().format(p.property.lot_sqm) + 'sqm';
                  }
                  return 'N/A';
                })(),
              });
          }
        } else if (child.props['data-table'] === 'other-building-units') {
          return p.property?.complex_compound_name && p.neighbours ? <OtherUnits neighbours={p.neighbours}>{child}</OtherUnits> : <></>;
        } else if (child.props.className === WEBFLOW_NODE_SELECTOR.PROPERTY_FEATURES) {
          return p.property ? <RxFeatures child={child} features={getFeatureIcons(p.property as PropertyDataModel)} /> : <></>;
        } else if (child.props.className === WEBFLOW_NODE_SELECTOR.PROPERTY_MAPS) {
          return p.property && p.property.lon && p.property.lat ? <RxPropertyMaps child={child} property={p.property} /> : <></>;
        } else if (child.props.className?.indexOf(WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_STATS) >= 0) {
          return (
            <RxActionBar {...p} {...child.props} agent={p.agent?.agent_id} slug={p.agent?.metatags?.profile_slug}>
              {child}
            </RxActionBar>
          );
        } else if (child.props.className?.split(' ').includes('little-profile-card')) {
          return React.cloneElement(child, {
            ...child.props,
            children: React.Children.map(child.props.children, cardelement => {
              if (cardelement.type === 'img' && p.agent?.metatags) {
                const photo = p.agent.metatags.profile_image || p.agent.metatags?.logo_for_light_bg || p.agent.metatags?.logo_for_dark_bg || '';
                return photo ? (
                  React.cloneElement(cardelement, {
                    ...cardelement.props,
                    src: getImageSized(photo, 100),
                  })
                ) : (
                  <></>
                );
              } else if (cardelement.type === 'div') {
                return (
                  <div className='flex flex-col gap-1'>
                    <h5 className='py-0 my-0'>{p.agent?.full_name}</h5>
                    <p className='text-sm my-0 py-0'>{p.agent?.phone}</p>
                  </div>
                );
              }
            }),
          });
        } else if (p.agent && child.props.className?.split(' ').includes('section-big-stats')) {
          return <RxPropertyStats property={p.property} child={child} agent={p.agent} />;
        }
        return (
          <div {...child.props}>
            <Iterator {...p}>{child.props.children}</Iterator>
          </div>
        );
      }

      if (child.type === 'img' && child.props?.['data-field']) {
        return <ImageRexifier {...p} {...child.props} />;
      }
    }
    return child;
  });

  return <>{Wrapped}</>;
}

function ImageRexifier({
  agent,
  property,
  neighbours,
  'map-image': src,
  ...props
}: {
  agent: AgentData;
  property: PropertyDataModel;
  id?: string;
  className?: string;
  'map-image': string;
  neighbours: PropertyDataModel[];
  'data-field': string;
}) {
  if (props['data-field'] === 'map_view') return <RxMapOfListing key={0} child={<div />} mapType={'neighborhood'} property={property} />;
  else if (props['data-field'] === 'street_view') {
    return <RxMapOfListing key={0} child={<div />} mapType={'street'} property={property} />;
  }
}

export default function RxCustomerPropertyView(p: Props) {
  const session = useEvent(Events.LoadUserSession);
  const selectPropertyEvt = useEvent(Events.SelectCustomerLovedProperty);
  const [property, selectProperty] = React.useState<PropertyDataModel>();
  const [other_units_in_bldg, setBuildingUnits] = React.useState<PropertyDataModel[]>();
  const [map_image, setMapImage] = React.useState('');
  const agent = (p.agent || session.data) as unknown as AgentData;

  React.useEffect(() => {
    if (selectPropertyEvt.data && Object.keys(selectPropertyEvt.data).length > 0) {
      selectProperty(selectPropertyEvt.data as unknown as PropertyDataModel);
    } else if (p.property) {
      selectProperty(p.property as unknown as LovedPropertyDataModel);
    }
  }, [selectPropertyEvt.data]);

  React.useEffect(() => {
    if (property?.complex_compound_name) {
      retrievePublicListingsFromPipeline({
        from: 0,
        size: 1000,
        sort: {
          'data.UpdateDate': 'desc',
        },
        query: {
          bool: {
            filter: [
              {
                match: {
                  'data.L_ComplexName': property?.complex_compound_name,
                },
              },
              {
                match: {
                  'data.IdxInclude': 'Yes',
                },
              },
              {
                match: {
                  'data.Status': 'Active' as string,
                },
              } as unknown as Record<string, string>,
            ],
            should: [],
            must_not: [
              {
                match: {
                  'data.MLS_ID': property.mls_id,
                },
              },
            ],
          },
        },
      } as LegacySearchPayload).then(({ records }: { records: PropertyDataModel[] }) => {
        if (records && records.length) setBuildingUnits(records);
      });
    }
  }, [property]);

  const { reload, property: selected_property, ...props } = p;

  return property ? (
    <div className={`${p.className} ${property?.id ? styles['opened-property-view'] : styles['closed-property-view']}`}>
      <Iterator {...props} property={property} map-image={map_image} neighbours={other_units_in_bldg} agent={agent} reload={reload}>
        {p.children}
      </Iterator>
    </div>
  ) : (
    <></>
  );
}
