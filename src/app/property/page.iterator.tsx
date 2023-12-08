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
import RecentListings from './recent-listings.module';
import PageAction from './page-action.module';
import { AgentData } from '@/_typings/agent';
import { LOGO_FIELDS } from '@/_constants/agent-fields';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import AnimatedComponent from './animated-component.module';

export default async function PropertyPageIterator({ children, ...props }: { children: ReactElement; agent: AgentData; property: PageData; photos: string[] }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.['data-action']) {
      const { children: subcomponents, property, ...subprops } = c.props;
      if (props.agent.agent_id)
        return (
          <PageAction
            {...subprops}
            data-action={c.props['data-action']}
            agent={props.agent.agent_id}
            slug={props.agent.metatags.profile_slug}
            data={props.property}
          >
            {subcomponents}
          </PageAction>
        );
      else return <></>;
    } else if (c.props?.['data-field']) {
      const { photos } = props;

      const data = props.property as unknown as { [key: string]: string };
      if (c.props?.['data-field'].indexOf('image_') === 0) {
        if (photos) {
          const num = Number(c.props?.['data-field'].split('image_').pop());
          if (!isNaN(num) && num && photos[num - 1]) return <RxCarouselPhoto {...c.props} width={1000} photos={photos} idx={num - 1} />;
        } else {
          return c;
        }
      } else if (c.props?.['data-field'] === 'reb_legal') {
        return cloneElement(c, {}, props.property.real_estate_board?.legal_disclaimer || '');
      } else if (c.props?.['data-field'] === 'feature_block') {
        return (
          <IconIterator className={c.props.className} property={props.property}>
            {c.props.children}
          </IconIterator>
        );
      } else if (c.props?.['data-field'] === 'property_info') {
        return Object.keys(data)
          .filter(k => property_info_kv[k])
          .map(k => {
            const v = formatValues(props.property, k);
            if (!v) return <></>;
            return (
              <div key={`${k}-${property_info_kv[k]}`} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
                <KeyValueIterator className={c.props.className} label={property_info_kv[k]} value={`${v || ''}`}>
                  {c.props.children}
                </KeyValueIterator>
              </div>
            );
          });
      } else if (c.props?.['data-field'] === 'financial_info') {
        return Object.keys(data)
          .filter(k => financial_kv[k])
          .map(k => {
            const v = formatValues(props.property, k);
            if (!v) return <></>;
            return (
              <div key={k} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
                <KeyValueIterator className={c.props.className} label={financial_kv[k]} value={`${formatValues(props.property, k) || ''}`}>
                  {c.props.children}
                </KeyValueIterator>
              </div>
            );
          });
      } else if (c.props?.['data-field'] === 'dimensions_info') {
        const dimensions: ReactElement[] = [];
        if (data.room_details) {
          const { rooms } = data.room_details as unknown as {
            rooms: RoomDetails[];
          };
          if (rooms.length === 0) {
            if (!getData('session_key')) {
              dimensions.push(
                <p className='italic'>
                  This information is restricted and only available to registered users of Leagent due to regulations. Please login (or signup) to view
                  restricted data.
                </p>,
              );
            } else {
              dimensions.push(<p className='italic'>Data is being collated at the moment, please check back in a few hours.</p>);
            }
          }
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
        } else {
          dimensions.push(<p className='italic'>Data is being collated at the moment, please check back in a few hours.</p>);
        }
        if (data.bathroom_details && getData('session_key')) {
          const { baths } = data.bathroom_details as unknown as {
            baths: BathroomDetails[];
          };
          if (baths && baths.length) {
            baths
              .filter(bath => bath.ensuite && bath.ensuite?.toLowerCase() === 'yes')
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
      } else if (c.props?.['data-field'] === 'headshot') {
        if (props.agent.metatags.headshot) {
          if (c.type !== 'img') return cloneElement(c, { style: { backgroundImage: `url(${getImageSized(props.agent.metatags.headshot, 160)})` } });
        }
      } else if (c.props?.['data-field'] === 'construction_info') {
        return Object.keys(data)
          .filter(k => construction_kv[k])
          .map(k => {
            const v = formatValues(props.property, k);
            if (!v) return <></>;
            return (
              <div key={k} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
                <KeyValueIterator className={c.props.className} label={construction_kv[k]} value={v}>
                  {c.props.children}
                </KeyValueIterator>
              </div>
            );
          });
      } else if (c.props?.['data-field'] === 'map_view') {
        return <RxMapOfListing key={0} child={<div />} mapType={'neighborhood'} property={props.property} />;
      } else if (c.props?.['data-field'] === 'street_view') {
        return <RxMapOfListing key={0} child={<div />} mapType={'street'} property={props.property} />;
      } else if (c.props?.['data-field'] === 'logo_for_light_bg') {
      } else if (c.props.children && ['facebook', 'linkedin', 'instagram', 'youtube', 'twitter'].includes(c.props['data-field'])) {
        const { metatags } = props.agent as unknown as {
          metatags: {
            [k: string]: string;
          };
        };
        return cloneElement(c, {
          className: classNames(c.props.className || '', 'property-page-rexified').trim(),
          href: `${metatags[c.props['data-field']] || `#no-${c.props['data-field']}`}`,
        });
      } else if (c.props.children && !['agent', 'agent_name', 'full_name', 'email', 'phone', 'logo'].includes(c.props['data-field'])) {
        let formatted_value = data[c.props['data-field']] || '';
        if (!formatted_value && LOGO_FIELDS.includes(c.props['data-field'])) {
          formatted_value = props.agent.full_name;
        }

        const prop = formatValues(data, c.props['data-field']);
        if (prop) formatted_value = `${prop}`;

        return cloneElement(
          c,
          {
            className: classNames(c.props.className || '', 'property-page-rexified').trim(),
          },
          formatted_value ? formatted_value : <i>Not available</i>,
        );
      } else
        return cloneElement(c, {
          className: classNames(c.props.className || '', 'property-page-rexified').trim(),
        });
    } else if (c.props?.['data-group'] === 'building_units') {
      return props.property.neighbours ? (
        <BuildingUnits className={c.props.className} neighbours={props.property.neighbours}>
          {c.props.children}
        </BuildingUnits>
      ) : (
        <></>
      );
    } else if (c.props?.['data-group'] === 'history' && props.property.postal_zip_code) {
      return (
        <SoldHistory className={c.props.className} address={props.property.title.toUpperCase()} postal_zip_code={props.property.postal_zip_code}>
          {c.props.children}
        </SoldHistory>
      );
    } else if (c.props?.style && c.props.children) {
      return (
        <AnimatedComponent {...c.props}>
          {cloneElement(c, {
            className: '',
            style: undefined,
          })}
        </AnimatedComponent>
      );
    } else if (c.props?.children && typeof c.props?.children !== 'string') {
      if (!['building_units', 'history'].includes(c.props?.['data-group'])) {
        if (c.props['data-group'] === 'similar_listings') {
          return props.property?.similar_listings?.length ? (
            <RecentListings {...props} className={c.props.className}>
              {c.props.children}
            </RecentListings>
          ) : (
            <></>
          );
        }
        return cloneElement(
          c,
          {
            className: classNames(c.props.className || '', 'property-page-rexified').trim(),
          },
          <PropertyPageIterator {...props}>{c.props.children}</PropertyPageIterator>,
        );
      }
    }
    return c;
  });
  return <>{Rexified}</>;
}
