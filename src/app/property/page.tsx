import axios from 'axios';
import { getAgentBy } from '../api/_helpers/agent-helper';
import { DOMNode, domToReact } from 'html-react-parser';
import { ReactElement } from 'react';
import { CheerioAPI, load } from 'cheerio';
import { buildCacheFiles, getBuildingUnits } from '../api/properties/model';
import NotFound from '../not-found';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import PhotosCarousel from '@/components/RxPropertyCarousel/PhotosCarousel';
import { headers } from 'next/headers';
import Iterator from './page.iterator';
import { PageData } from './type.definition';
import FooterIterator from '@/components/RxFooter';
import { AgentData } from '@/_typings/agent';
import NavIterator from '@/components/Nav/RxNavIterator';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { BuildingUnit } from '../api/properties/types';
import RxNotifications from '@/components/RxNotifications';
import { replaceAgentFields } from './page.helpers';

function isBuildingUnit(property: { complex_compound_name?: string; style_type?: string }) {
  return property.style_type?.includes('Apartment') || property.complex_compound_name;
}

export default async function PropertyPage(props: any) {
  let start = Date.now();

  if (props.searchParams?.mls && props.params['profile-slug'].indexOf('la-') === 0) {
    let agent_id = props.params.slug || '';
    let profile_slug = props.params['profile-slug'] || '';

    let agent = {
      id: Number(headers().get('x-record-id')),
      agent_id,
      full_name: `${headers().get('x-agent-name')}`,
      email: `${headers().get('x-agent-email')}`,
      phone: `${headers().get('x-agent-phone')}`,
      webflow_domain: `${headers().get('x-wf-domain') || WEBFLOW_DASHBOARDS.CUSTOMER}`,
      metatags: {
        id: Number(headers().get('x-metatag-id')),
        profile_slug,
        title: `${headers().get('x-page-title')}`,
        description: `${headers().get('x-page-description')}`,
        logo_for_light_bg: '',
        logo_for_dark_bg: '',
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
    }

    console.log('Agent data retrieved in', Date.now() - start, 'miliseconds');
    if (agent.full_name) {
      const page_url = `https://sites.leagent.com/${agent.webflow_domain}/property/propertyid.html`;
      let { data: html_data } = await axios.get(page_url);

      html_data = html_data.split('href="/"').join(`href="/${agent_id}/${agent.metatags.profile_slug}"`);
      html_data = html_data.split('href="/map"').join(`href="${headers().get('x-map-uri')}"`);

      const $: CheerioAPI = load(html_data);
      $('a[data-action="pdf"]').attr('href', `/${agent.agent_id}/${agent.metatags.profile_slug}/pdf?mls=${props.searchParams.mls}`);
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
      // Retrieve property
      const listing = await buildCacheFiles(props.searchParams.mls);

      if (listing) {
        console.log('Property data retrieved in', Date.now() - start, 'miliseconds');
        const { photos, ...property } = listing as PageData;

        let neighbours: BuildingUnit[] = [];
        if (property.lat && property.lon && isBuildingUnit(property)) {
          neighbours = await getBuildingUnits(property);
        }

        if (property) {
          if (Array.isArray(property.fireplace)) property.fireplace = property.fireplace.join('/');

          if (property?.room_details?.rooms) {
            property.total_kitchens = property.room_details.rooms.filter(room => room.type.toLowerCase().includes('kitchen')).length;
          }
          const navbar = $('body > .navigation');
          const footer = $('body > footer, .f-footer-small');

          $('body > .navigation').remove();
          $('body > footer, .f-footer-small').remove();

          const body = $('body > div,section');

          return (
            <>
              <NavIterator agent={agent}>{domToReact(navbar as unknown as DOMNode[]) as unknown as ReactElement}</NavIterator>

              <Iterator
                agent={agent}
                property={
                  {
                    ...property,
                    neighbours,
                  } as unknown as PageData
                }
                photos={photos || []}
              >
                {domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}
              </Iterator>
              <FooterIterator agent={agent}>{domToReact(footer as unknown as DOMNode[]) as unknown as ReactElement}</FooterIterator>

              <PhotosCarousel propertyPhotos={(photos ?? []).map(src => getImageSized(src, 1280))} />
              <RxNotifications />
            </>
          );
        }
      }

      return <NotFound>The property does not exist</NotFound>;
    }
  }
}
