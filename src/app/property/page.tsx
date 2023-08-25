import axios from 'axios';
import { getAgentBy } from '../api/_helpers/agent-helper';
import { DOMNode, domToReact } from 'html-react-parser';
import { Children, ReactElement, cloneElement } from 'react';
import { CheerioAPI, load } from 'cheerio';
import { buildCacheFiles } from '../api/properties/model';
import NotFound from '../not-found';
import { PropertyDataModel } from '@/_typings/property';
import { classNames } from '@/_utilities/html-helper';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import PhotosCarousel from '@/components/RxPropertyCarousel/PhotosCarousel';
import RxCarouselPhoto from './carousel-photo.module';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { headers } from 'next/headers';

interface PageData extends PropertyDataModel {
  listing_by: string;
  real_estate_board_name: string;
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
      $('title').replaceWith(`<title>${headers().get('x-page-title')}</title>`);

      replaceAgentFields($);
      replaceLogos($);
      // Retrieve property
      const listing = await buildCacheFiles(props.searchParams.mls);
      if (listing) {
        const { photos, ...property } = listing as PropertyDataModel;

        console.log('Property data retrieved in', Date.now() - start, 'miliseconds');

        if (property) {
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

function Iterator({ children, ...props }: { children: ReactElement; property: PageData; photos: string[] }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.['data-field']) {
      const { property, photos } = props;

      const data = property as unknown as { [key: string]: string };
      if (photos && c.props?.['data-field'].indexOf('image_') === 0) {
        const num = Number(c.props?.['data-field'].split('image_').pop());
        if (!isNaN(num) && num && photos[num - 1]) return <RxCarouselPhoto {...c.props} width={1000} photos={photos} idx={num - 1} />;
      } else if (c.props?.['data-field'] === 'logo_for_light_bg') {
      } else if (c.props.children && data[c.props['data-field']])
        return cloneElement(
          c,
          {
            className: classNames(c.props.className || '', 'property-page-rexified').trim(),
          },
          formatValues(property, c.props['data-field']),
        );
      else
        return cloneElement(c, {
          className: classNames(c.props.className || '', 'property-page-rexified').trim(),
        });
    } else if (c.props?.children && typeof c.props?.children !== 'string') {
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
