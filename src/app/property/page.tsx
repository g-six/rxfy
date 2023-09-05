import axios from 'axios';
import { getAgentBy } from '../api/_helpers/agent-helper';
import { DOMNode, domToReact } from 'html-react-parser';
import { ReactElement } from 'react';
import { CheerioAPI, load } from 'cheerio';
import { buildCacheFiles } from '../api/properties/model';
import NotFound from '../not-found';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import PhotosCarousel from '@/components/RxPropertyCarousel/PhotosCarousel';
import { headers } from 'next/headers';
import Iterator from './page.iterator';
import { PageData } from './type.definition';
import Navbar from '../navbar.module';

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

  if (props.searchParams?.mls && props.params['profile-slug'].indexOf('la-') === 0) {
    let agent_id = props.params.slug || '';
    let profile_slug = props.params['profile-slug'] || '';
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
          const navbar = $('body .navbar-component');
          $('body .navbar-component').remove();
          const body = $('body > div,section');
          const footer = $('body > footer');
          return (
            <>
              <Navbar>{domToReact(navbar as unknown as DOMNode[]) as unknown as ReactElement}</Navbar>
              <Iterator property={property as unknown as PageData} photos={photos || []}>
                {domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}
              </Iterator>
              {domToReact(footer as unknown as DOMNode[]) as unknown as ReactElement}

              <PhotosCarousel propertyPhotos={(photos ?? []).map(src => getImageSized(src, 1280))} />
            </>
          );
        }
      }

      return <NotFound>The property does not exist</NotFound>;
    }
  }
}
