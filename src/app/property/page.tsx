import axios from 'axios';
import { getAgentBy } from '../api/_helpers/agent-helper';
import { DOMNode, domToReact } from 'html-react-parser';
import { Children, ReactElement, cloneElement } from 'react';
import { CheerioAPI, load } from 'cheerio';
import { buildCacheFiles } from '../api/properties/model';
import NotFound from '../not-found';
import { BathroomDetails, PropertyDataModel, RoomDetails } from '@/_typings/property';
import { classNames } from '@/_utilities/html-helper';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import PhotosCarousel from '@/components/RxPropertyCarousel/PhotosCarousel';
import RxCarouselPhoto from './carousel-photo.module';
import { formatValues, slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { headers } from 'next/headers';
import RxMapOfListing from '@/components/RxMapOfListing';
import { construction_kv, financial_kv, property_info_kv } from './type.definition';
import BuildingUnits from './building-units.module';
import SoldHistory from './sold-history.module';

interface PageData extends PropertyDataModel {
  listing_by: string;
  real_estate_board_name: string;
  total_kitchens?: number;
}
interface PropertyFeaturesWithIcons {
  amenities: { name: string }[];
  appliances: { name: string }[];
  facilities: { name: string }[];
  connected_services: { name: string }[];
  parking: { name: string }[];
  places_of_interest: { name: string }[];
}

function replaceAgentFields($: CheerioAPI) {
  if ($('img[data-field="headshot"]')) {
    const src = headers().get('x-agent-headshot');
    if (src) {
      $('img[data-field="headshot"]').each((i, img_element) => {
        $(img_element).removeAttr('srcset');
        $(img_element).replaceWith(`${$(img_element).toString()}`.split($(img_element).attr('src') as string).join(src));
      });
    }
  }
  $('[data-field="agent_name"]').html(headers().get('x-agent-name') as string);
  if (headers().get('x-agent-email')) {
    $('[data-field="email"]').html(headers().get('x-agent-email') as string);
    $('[data-field="email"]')
      .parent('a')
      .attr('href', `mailto:${headers().get('x-agent-email') as string}`);
  }
  if (headers().get('x-agent-phone')) {
    $('[data-field="phone"]').html(headers().get('x-agent-phone') as string);
    $('[data-field="phone"]')
      .parent('a')
      .attr('href', `tel:${headers().get('x-agent-phone') as string}`);
  } else $('[data-field="phone"]').remove();
}

function replaceLogos($: CheerioAPI) {
  if ($('[data-field="logo_for_light_bg"]')) {
    const src = headers().get('x-dark-bg-logo');
    if (src)
      $('[data-field="logo_for_light_bg"]').replaceWith(`
            <div
                style="background-image: url(${getImageSized(src, 250)});"
                class="${$('[data-field="logo_for_light_bg"]').attr('class')} flex w-40 h-10 bg-contain bg-no-repeat"
            />`);
  }
}

export default async function PropertyPage(props: any) {
  let start = Date.now();

  if (props.searchParams?.mls && props.params?.slug && props.params?.['profile-slug'] && props.params['profile-slug'].indexOf('la-') === 0) {
    const agent_id = props.params.slug;
    const profile_slug = props.params['profile-slug'];
    let webflow_domain = 'leagent-webflow-rebuild.leagent.com',
      full_name = '';
    if (headers().get('x-agent-name')) {
      webflow_domain = `${headers().get('x-wf-domain')}`;
      full_name = `${headers().get('x-agent-name')}`;
    } else {
      const agent = await getAgentBy({
        agent_id,
      });
      webflow_domain = agent.webflow_domain;
      full_name = agent.full_name;
    }

    console.log('Agent data retrieved in', Date.now() - start, 'miliseconds');

    if (full_name) {
      const page_url = `https://sites.leagent.com/${webflow_domain}/property/propertyid.html`;
      let { data: html_data } = await axios.get(page_url);
      html_data = html_data.split('href="/"').join(`href="/${agent_id}/${profile_slug}"`);
      html_data = html_data.split('href="/map"').join(`href="${headers().get('x-map-uri')}"`);
      const $: CheerioAPI = load(html_data);
      $('a[data-action="pdf"]').attr('href', `/${agent_id}/${profile_slug}/pdf?mls=${props.searchParams.mls}`);
      $('[data-field="financial_info"]').each((i, el) => {
        if (i > 0) $(el).remove();
      });
      $('[data-field="construction_info"]').each((i, el) => {
        if (i > 0) $(el).remove();
      });
      $('[data-field="feature_block"]').each((i, el) => {
        if (i > 0) $(el).remove();
      });

      replaceAgentFields($);
      replaceLogos($);
      // Retrieve property
      const listing = await buildCacheFiles(props.searchParams.mls);

      if (listing) {
        console.log('Property data retrieved in', Date.now() - start, 'miliseconds');
        const { photos, ...property } = listing as PageData;

        if (property) {
          if (Array.isArray(property.fireplace)) property.fireplace = property.fireplace.join('/');

          if (property?.room_details?.rooms) {
            property.total_kitchens = property.room_details.rooms.filter(room => room.type.toLowerCase().includes('kitchen')).length;
          }
          const body = $('body > div');
          return (
            <>
              <Iterator property={property as unknown as PageData} photos={photos || []}>
                {domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}
              </Iterator>
              <PhotosCarousel propertyPhotos={(photos ?? []).map(src => getImageSized(src, 1280))} />
            </>
          );
        }
      }

      return <NotFound>The property does not exist</NotFound>;
    }
  }
}

function KeyValueIterator({ children, ...props }: { children: ReactElement; label: string; value: string; className: string }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.['data-field']) {
      if (c.props?.['data-field'].indexOf('_name') > 0) return cloneElement(c, {}, props.label);
      if (c.props?.['data-field'].indexOf('_result') > 0) return cloneElement(c, {}, props.value);
    } else if (c.props?.children && typeof c.props.children !== 'string') {
      return cloneElement(c, {}, <KeyValueIterator {...props}>{c.props.children}</KeyValueIterator>);
    }
    return c;
  });

  return <div className={props.className}>{Rexified}</div>;
}
function getAlias(feature: string) {
  if (feature.includes('water')) return 'water';
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
      return 'garage-underbuilding';
    default:
      return feature;
  }
}

const no_icons = ['dryer', 'other'];

function IconIterator({ children, property, className }: { children: ReactElement; property: PageData; className: string }) {
  const { amenities, appliances, facilities, connected_services, parking, places_of_interest } = property as unknown as PropertyFeaturesWithIcons;
  const Icons: ReactElement[] = [];
  let iconables = amenities || [];

  let has_water = false;
  if (appliances?.length) iconables = iconables.concat(appliances);
  if (connected_services?.length) iconables = iconables.concat(connected_services);
  if (facilities?.length) iconables = iconables.concat(facilities);
  if (parking?.length) iconables = iconables.concat(parking);
  if (places_of_interest?.length) iconables = iconables.concat(places_of_interest);

  iconables.forEach(({ name }, idx) => {
    const key = slugifyAddress(name.toLowerCase());
    if (!no_icons.includes(key))
      Icons.push(
        <div key={`${idx}-${key}`} className={className}>
          {Children.map(children, c => {
            let icons: ReactElement[] = [];
            if (c.type === 'img') {
              return cloneElement(c, { src: `/icons/features/feature_${getAlias(key)}.svg` });
            }
            return cloneElement(
              c,
              {
                key: key,
              },
              name,
            );
          })}
        </div>,
      );
  });

  return <>{Icons}</>;
}

function Iterator({ children, ...props }: { children: ReactElement; property: PageData; photos: string[] }) {
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
              <div key={`${k.type} ${k.level} ${k.width} x ${k.length}`} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
                <KeyValueIterator className={c.props.className} label={k.type} value={`${k.width} x ${k.length}`}>
                  {c.props.children}
                </KeyValueIterator>
              </div>
            ))
            .concat(
              rooms
                .filter(room => room.type?.toLowerCase() === 'bedroom')
                .map((k, idx) => (
                  <div key={`${k.type} ${k.level} ${k.width} x ${k.length}`} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
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
                <div key={`${k.level} ensuite bath ${k.pieces}-pc`} className={classNames(c.props.children.className || '', 'property-page-rexified')}>
                  <KeyValueIterator className={c.props.className} label={`${k.level} ensuite bath`} value={`${k.pieces}-pc`}>
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
    } else if (c.props?.children && typeof c.props?.children !== 'string' && !['building_units', 'history'].includes(c.props?.['data-group'])) {
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
