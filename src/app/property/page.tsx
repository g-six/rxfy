import axios from 'axios';
import { getAgentBy } from '../api/_helpers/agent-helper';
import { DOMNode, domToReact } from 'html-react-parser';
import { ReactElement } from 'react';
import { CheerioAPI, load } from 'cheerio';
import { buildCacheFiles, getBuildingUnits } from '../api/properties/model';
import NotFound from '../not-found';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { headers } from 'next/headers';
import Iterator from './page.iterator';
import { PageData } from './type.definition';
import FooterIterator from '@/components/RxFooter';
import { AgentData } from '@/_typings/agent';
import NavIterator from '@/components/Nav/RxNavIterator';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { BuildingUnit } from '../api/properties/types';
import RxNotifications from '@/components/RxNotifications';
import { getPrivateListing } from '../api/private-listings/model';
import { PropertyDataModel } from '@/_typings/property';
import { getSimilarMLSListings } from '../api/similar-properties/controller';

function isBuildingUnit(property: { complex_compound_name?: string; style_type?: string }) {
  return property.style_type?.includes('Apartment') || property.complex_compound_name;
}

export default async function PropertyPage(props: any) {
  try {
    let start = Date.now();

    let { mls, lid } = props.searchParams;

    let agent_id = headers().get('x-agent-id') || '';
    if (!agent_id && props.params.slug) {
      agent_id = props.params.slug;
    }

    let profile_slug = headers().get('x-profile-slug') || '';

    if ((mls || lid) && profile_slug.indexOf('la-') === 0) {
      let agent = {
        id: Number(headers().get('x-record-id')),
        agent_id,
        full_name: `${headers().get('x-agent-name') || ''}`,
        email: `${headers().get('x-agent-email')}`,
        phone: `${headers().get('x-agent-phone')}`,
        domain_name: `${headers().get('x-agent-domain-name') || ''}`,
        webflow_domain: `${headers().get('x-wf-domain') || WEBFLOW_DASHBOARDS.CUSTOMER}`,
        metatags: {
          id: Number(headers().get('x-metatag-id')),
          profile_slug,
          title: `${headers().get('x-page-title')}`,
          description: `${headers().get('x-page-description')}`,
          logo_for_light_bg: '',
          logo_for_dark_bg: '',
          facebook_url: headers().get('x-facebook-url') || '',
          instagram_url: headers().get('x-instagram-url') || '',
          youtube_url: headers().get('x-youtube-url') || '',
          linkedin_url: headers().get('x-linkedin-url') || '',
        },
      } as AgentData;

      if (headers().get('x-light-bg-logo')) {
        agent.metatags.logo_for_light_bg = `${headers().get('x-light-bg-logo')}`;
      }
      if (headers().get('x-dark-bg-logo')) {
        agent.metatags.logo_for_dark_bg = `${headers().get('x-dark-bg-logo')}`;
      }
      if (headers().get('x-agent-headshot')) {
        agent.metatags.headshot = headers().get('x-agent-headshot') as string;
      }

      if (!agent.full_name) {
        agent = await getAgentBy({
          agent_id,
        });
        console.log('Agent data retrieved in', Date.now() - start, 'miliseconds');
      }

      if (agent.full_name) {
        const page_url = `https://sites.leagent.com/${agent.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/property/propertyid.html`;

        console.log('');
        console.log('Retrieving', page_url);
        let html_data = '';

        try {
          let { data: theme_html } = await axios.get(page_url);
          html_data = theme_html;
        } catch (e) {
          console.log('');
          console.log('Page does not exist or is an invalid Web Page');
          console.log('Fail to retrieve Webflow HTML for page', page_url);
          return <NotFound />;
        }

        console.log('');
        console.log('Building section 1', page_url);

        // html_data = html_data.split('href="/"').join(`href="/${agent_id}/${agent.metatags.profile_slug}"`);
        html_data = html_data.split('href="/map"').join(`href="${headers().get('x-map-uri')}"`);

        const $: CheerioAPI = load(html_data);
        $('a[data-action="pdf"]').attr('href', `/${agent.agent_id}/${agent.metatags.profile_slug}/pdf?mls=${mls}`);
        $('[data-group="similar_home"]:not(:first-child)').remove();
        $('[data-field="financial_info"]').each((i, el) => {
          if (i > 0) $(el).remove();
        });
        $('[data-field="construction_info"]').each((i, el) => {
          if (i > 0) $(el).remove();
        });
        $('[data-field="feature_block"]').each((i, el) => {
          if (i > 0) $(el).remove();
        });

        if (agent) {
          if (agent.full_name) {
            $('[data-field="agent_name"]').html(agent.full_name);
            $('[data-field="agent_name"]').attr('data-val', agent.full_name);
          }

          if (agent.phone) $('[data-field="phone"]').html(agent.phone);

          if (agent.email) $('[data-field="email"]').html(agent.email);
        }
        console.log('Building section 2', page_url);
        // Retrieve property
        let listing = undefined;
        if (lid) {
          listing = await getPrivateListing(lid);
          listing = listing as PropertyDataModel;
        } else {
          listing = await buildCacheFiles(mls);
          listing = listing as PropertyDataModel;
        }

        console.log('');
        console.log('Building section 3', page_url);
        if (listing) {
          console.log('Property data retrieved in', Date.now() - start, 'miliseconds');
          const similar_listings = await getSimilarListings(listing);
          const { photos, ...property } = listing as PageData;

          let neighbours: BuildingUnit[] = [];

          if (property) {
            if (property.lat && property.lon && isBuildingUnit(property)) {
              neighbours = await getBuildingUnits(property);
            }
            if (property.fireplace && Array.isArray(property.fireplace)) property.fireplace = property.fireplace.join('/');

            if (property?.room_details?.rooms) {
              if (headers().get('session_key')) {
                property.total_kitchens = property.room_details.rooms.filter(room => room.type && room.type.toLowerCase().includes('kitchen')).length;
              } else {
                property.room_details.rooms = [];
              }
            }
            $('[data-node-type]').remove();
            const navbar = $('body > [data-component="navigation"]');
            const footer = $('[data-component="footer"],[data-group="footer"]');

            $('body > [data-component="navigation"]').remove();
            $('[data-component="footer"]').remove();
            $('[data-field="property-price"]').each((i, el) => {
              $(el).attr('data-field', 'asking_price');
            });

            const carousel_json = $('body script.w-json');
            if (carousel_json && photos && photos.length) {
              $('body script.w-json').html(
                JSON.stringify({
                  items: photos.map(url => ({
                    _id: url,
                    origFileName: url.split('/').pop(),
                    fileName: url.split('/').pop(),
                    url: getImageSized(url, 1280),
                    type: 'image',
                  })),
                }),
              );
            } else $('body script.w-json').remove();

            const body = $('body > div');

            return (
              <>
                <NavIterator agent={agent}>{domToReact(navbar as unknown as DOMNode[]) as unknown as ReactElement}</NavIterator>

                <Iterator
                  agent={agent}
                  property={
                    {
                      ...property,
                      neighbours,
                      similar_listings,
                    } as unknown as PageData
                  }
                  photos={photos || []}
                >
                  {domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}
                </Iterator>
                <FooterIterator agent={agent}>{domToReact(footer as unknown as DOMNode[]) as unknown as ReactElement}</FooterIterator>

                <RxNotifications />
              </>
            );
          }
        }

        return <NotFound>The property does not exist</NotFound>;
      }
    }
  } catch (e) {
    console.log('Layout 120', e);
    return <NotFound />;
  }
}

async function getSimilarListings(property: unknown) {
  const { asking_price, area, lat, lon, mls_id, city, property_type, beds, state_province, complex_compound_name } = property as {
    lat: number;
    lon: number;
    asking_price: number;
    beds: number;
    area: string;
    city: string;
    mls_id: string;
    style_type: string;
    property_type: string;
    state_province: string;
    complex_compound_name: string;
  };
  let bounds: number[] = [];

  const filters = {
    asking_price,
    lat,
    lon,
    area,
    city,
    mls_id,
    beds,
    property_type,
    state_province,
    complex_compound_name,
  };

  const listings = await getSimilarMLSListings(filters);

  return (listings || []).map(({ photos, title, asking_price, beds, baths, area, city, state_province, postal_zip_code, floor_area }: PropertyDataModel) => ({
    cover_photo: photos?.length ? getImageSized(photos[0], 400) : undefined,
    title,
    asking_price,
    beds,
    baths,
    area,
    city,
    state_province,
    floor_area,
    postal_zip_code,
  }));

  // Object.keys(property).forEach(filter => {
  //   if (['property_type', 'lat', 'lon', 'beds', 'complex_compound_name', 'postal_zip_code'].includes(filter) && property[filter]) {
  //     filters = {
  //       ...filters,
  //       [filter]: ['property_type', 'postal_zip_code', 'complex_compound_name'].includes(filter) ? encodeURIComponent(property[filter]) : property[filter],
  //     };
  //   }
  // });

  // const response = await axios.get(url, {
  //   headers: {
  //     Authorization: `Bearer ${Cookies.get('session_key')}`,
  //     'Content-Type': 'application/json',
  //   },
  // });
}
