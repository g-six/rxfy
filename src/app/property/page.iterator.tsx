'use client';

import { Children, ReactElement, cloneElement } from 'react';
import { classNames } from '@/_utilities/html-helper';
import { BathroomDetails, RoomDetails } from '@/_typings/property';
import RxMapOfListing from '@/components/RxMapOfListing';
import { PageData, construction_kv, financial_kv, property_info_kv } from './type.definition';
import RxCarouselPhoto from './carousel-photo.module';
import BuildingUnits from './building-units.module';
import SoldHistory from './sold-history.module';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import IconIterator from './features.iterator';
import KeyValueIterator from './key-value-pair.iterator';
import { Transition } from '@headlessui/react';
import RecentListings from './recent-listings.module';

export default function Iterator({ children, ...props }: { children: ReactElement; property: PageData; photos: string[] }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.['data-field']) {
      const { property, photos } = props;

      const data = property as unknown as { [key: string]: string };
      if (photos && c.props?.['data-field'].indexOf('image_') === 0) {
        const num = Number(c.props?.['data-field'].split('image_').pop());
        if (!isNaN(num) && num && photos[num - 1]) return <RxCarouselPhoto {...c.props} width={1000} photos={photos} idx={num - 1} />;
      } else if (c.props?.['data-field'] === 'feature_block') {
        return (
          <IconIterator className={c.props.className} property={property}>
            {c.props.children}
          </IconIterator>
        );
      } else if (c.props?.['data-field'] === 'property_info') {
        return Object.keys(data)
          .filter(k => property_info_kv[k])
          .map(k => (
            <div key={`${k}-${property_info_kv[k]}`} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
              <KeyValueIterator className={c.props.className} label={property_info_kv[k]} value={formatValues(property, k)}>
                {c.props.children}
              </KeyValueIterator>
            </div>
          ));
      } else if (c.props?.['data-field'] === 'financial_info') {
        return Object.keys(data)
          .filter(k => financial_kv[k])
          .map(k => (
            <div key={k} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
              <KeyValueIterator className={c.props.className} label={financial_kv[k]} value={formatValues(property, k)}>
                {c.props.children}
              </KeyValueIterator>
            </div>
          ));
      } else if (c.props?.['data-field'] === 'dimensions_info') {
        const dimensions: ReactElement[] = [];
        if (data.room_details) {
          const { rooms } = data.room_details as unknown as {
            rooms: RoomDetails[];
          };
          rooms
            .filter(room => room.type?.toLowerCase() !== 'bedroom' && room.type?.toLowerCase().includes('bed'))
            .map((k, idx) => (
              <div
                key={`${k.type} ${k.level} ${k.width} x ${k.length} ${idx}`}
                className={classNames(c.props.children.className || '', 'property-page-rexified')}
              >
                <KeyValueIterator className={c.props.className} label={k.type} value={`${k.width} x ${k.length}`}>
                  {c.props.children}
                </KeyValueIterator>
              </div>
            ))
            .concat(
              rooms
                .filter(room => room.type?.toLowerCase() === 'bedroom')
                .map((k, idx) => (
                  <div
                    key={`${k.type} ${k.level} ${k.width} x ${k.length} ${idx}`}
                    className={classNames(c.props.children.className || '', 'property-page-rexified')}
                  >
                    <KeyValueIterator className={c.props.className} label={k.type} value={`${k.width} x ${k.length}`}>
                      {c.props.children}
                    </KeyValueIterator>
                  </div>
                )),
            )
            .forEach(r => dimensions.push(r));
        }
        if (data.bathroom_details) {
          const { baths } = data.bathroom_details as unknown as {
            baths: BathroomDetails[];
          };
          if (baths && baths.length) {
            baths
              .filter(bath => bath.ensuite?.toLowerCase() === 'yes')
              .map((k, idx) => (
                <div
                  key={`${idx + 1}-${k.level}-ensuite-bath-${k.pieces}-pc`}
                  className={classNames(c.props.children.className || '', 'property-page-rexified')}
                >
                  <KeyValueIterator className={c.props.className} label={`Ensuite bath ${idx + 1} (${k.level} floor)`} value={`${k.pieces}-pc`}>
                    {c.props.children}
                  </KeyValueIterator>
                </div>
              ))
              .forEach(b => dimensions.push(b));
          }
        }

        if (data.room_details) {
          const { rooms } = data.room_details as unknown as {
            rooms: RoomDetails[];
          };
          rooms
            .filter(room => !room.type?.toLowerCase().includes('bed'))
            .map((k, idx) => (
              <div key={idx} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
                <KeyValueIterator className={c.props.className} label={k.type} value={`${k.width} x ${k.length}`}>
                  {c.props.children}
                </KeyValueIterator>
              </div>
            ))
            .forEach(r => dimensions.push(r));
        }

        return dimensions;
      } else if (c.props?.['data-field'] === 'construction_info') {
        return Object.keys(data)
          .filter(k => construction_kv[k])
          .map(k => (
            <div key={k} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
              <KeyValueIterator className={c.props.className} label={construction_kv[k]} value={formatValues(property, k)}>
                {c.props.children}
              </KeyValueIterator>
            </div>
          ));
      } else if (c.props?.['data-field'] === 'map_view') {
        return <RxMapOfListing key={0} child={<div />} mapType={'neighborhood'} property={property} />;
      } else if (c.props?.['data-field'] === 'street_view') {
        return <RxMapOfListing key={0} child={<div />} mapType={'street'} property={property} />;
      } else if (c.props?.['data-field'] === 'logo_for_light_bg') {
      } else if (c.props.children && !['agent', 'agent_name', 'email', 'phone'].includes(c.props['data-field']))
        return cloneElement(
          c,
          {
            className: classNames(c.props.className || '', 'property-page-rexified').trim(),
          },
          data[c.props['data-field']] ? formatValues(property, c.props['data-field']) : 'N/A',
        );
      else
        return cloneElement(c, {
          className: classNames(c.props.className || '', 'property-page-rexified').trim(),
        });
    } else if (c.props?.['data-group'] === 'building_units' && props.property.postal_zip_code) {
      return (
        <BuildingUnits
          className={c.props.className}
          mls-id={props.property.mls_id}
          address={props.property.title.split(' ').slice(2).join(' ')}
          street_number={props.property.title.split(' ')[1]}
          postal_zip_code={props.property.postal_zip_code}
        >
          {c.props.children}
        </BuildingUnits>
      );
    } else if (c.props?.['data-group'] === 'history' && props.property.postal_zip_code) {
      return (
        <SoldHistory className={c.props.className} address={props.property.title.toUpperCase()} postal_zip_code={props.property.postal_zip_code}>
          {c.props.children}
        </SoldHistory>
      );
    } else if (c.props?.style) {
      return (
        <Transition
          appear={false}
          show={true}
          enter='transition-opacity duration-75'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='transition-opacity duration-150'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          {cloneElement(c, {
            className: '',
            style: undefined,
          })}
        </Transition>
      );
    } else if (c.props?.children && typeof c.props?.children !== 'string' && !['building_units', 'history'].includes(c.props?.['data-group'])) {
      if (c.props.className?.includes('recent-listings-grid')) {
        return (
          <RecentListings {...props} className={c.props.className}>
            {c.props.children}
          </RecentListings>
        );
      }
      return cloneElement(
        c,
        {
          className: classNames(c.props.className || '', 'property-page-rexified').trim(),
        },
        <Iterator {...props}>{c.props.children}</Iterator>,
      );
    }
    return c;
  });
  return <>{Rexified}</>;
}
