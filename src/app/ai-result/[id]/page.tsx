import NotFound from '@/app/not-found';
import axios from 'axios';
import { Cheerio, CheerioAPI, Element, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { ReactElement } from 'react';
import Iterator from './iterator.module';
import { getAgentBy } from '@/app/api/_helpers/agent-helper';
import { AgentData } from '@/_typings/agent';
import { getSampleListings } from '@/app/api/new-agent/utilities';
import { buildCacheFiles } from '@/app/api/properties/model';
import { PropertyDataModel } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { createPhotoAlbumForProperty } from '@/app/api/property-photo-albums/model';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { objectToQueryString } from '@/_utilities/url-helper';
export default async function AiResultPage({ params }: { params: { id: string } }) {
  try {
    const promises = await Promise.all([
      axios.get(`https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN}/ai-result.html`),
      getAgentBy({ agent_id: params.id }),
    ]);

    const [ai_result_page, agent_data] = promises;
    const { data: html } = ai_result_page;

    let profile_slug = '';
    if (agent_data) {
      profile_slug = agent_data.metatags?.profile_slug;
    }

    if (html && profile_slug) {
      const $: CheerioAPI = load(html);
      $('.tabs-content [data-w-tab="Property Page"] > *').replaceWith(
        `<iframe src="/${params.id}/${profile_slug}/property?mls=R2814552" class="w-full h-full" />`,
      );

      $('.tabs-content .home-oslo').replaceWith(`<iframe src="/${params.id}/${profile_slug}?theme=oslo" class="w-full h-full" />`);
      $('.tabs-content .home-malta').replaceWith(`<iframe src="/${params.id}/${profile_slug}?theme=malta" class="w-full h-full" />`);
      $('.tabs-content .home-hamburg').replaceWith(`<iframe src="/${params.id}/${profile_slug}?theme=hamburg" class="w-full h-full" />`);
      $('.tabs-content .home-alicante').replaceWith(`<iframe src="/${params.id}/${profile_slug}?theme=alicante" class="w-full h-full" />`);

      $('.tabs-content [data-w-tab="PDF Brochure"] > *').replaceWith(
        `<iframe src="https://leagent.com/api/pdf/mls/R2814552?agent=${params.id}&slug=${profile_slug}" class="w-full h-full" />`,
      );
      $('.tabs-content [data-w-tab="Listings Map"]').attr('style', 'width: 100%; height: 100%');
      $('.tabs-content [data-w-tab="Listings Map"]').wrapInner(
        `<iframe src="https://leagent.com/${params.id}/${profile_slug}/map?${objectToQueryString(agent_data.metatags.geocoding)}" class="w-full h-full" />`,
      );
      const compare_item = $('[data-component="compare_column"]');
      let cards = '';
      const listings = await getSampleListings(params.id, agent_data.metatags.geocoding, 3);

      const {
        hits: { hits },
      } = listings.data;
      let MLS_ID = '';
      const cards_data = await Promise.all(
        hits.map(
          ({
            _source: { data: hit },
          }: {
            _source: {
              data: {
                MLS_ID: string;
                photos: string[];
              };
            };
          }) => buildCacheFiles(hit.MLS_ID),
        ),
      );

      cards_data.forEach((p: PropertyDataModel) => {
        let item = compare_item.clone();
        item.find('[data-field]').each((i, el) => {
          switch (el.attribs['data-field']) {
            case 'address':
              $(el).replaceWith(`<${el.name} class="${$(el).attr('class')}">${formatValues(p, 'title')}</${el.name}>`);
            case 'cover_photo':
              if (p.cover_photo)
                $(el).replaceWith(
                  `<div data-mls="${p.mls_id}" class="${$(el).attr('class')}" style="background-image: url(${p.cover_photo})">${$(el).html()}</div>`,
                );
              else if (p.id && p.photos?.length) {
                createPhotoAlbumForProperty(p.id, p.photos);
                $(el).replaceWith(
                  `<div data-mls="${p.mls_id}" class="${$(el).attr('class')}" style="background-image: url(${getImageSized(p.photos[0], 400)})">${$(
                    el,
                  ).html()}</div>`,
                );
              }
              break;
            default:
              $(el).replaceWith(`<${el.name} class="${$(el).attr('class')}">${formatValues(p, el.attribs['data-field'])}</${el.name}>`);
              break;
          }
        });
        let stats = '';
        const wrapper_class = $('[data-group="compare_stat"]').parent().attr('class');
        if (p.year_built) {
          const stat = $('[data-group="compare_stat"]').clone();
          let row = '';
          stat.find('> *').each((i, c) => {
            let text = '';
            if (i > 0) {
              text = `${p.year_built}`;
            } else {
              text = 'Year Built';
            }
            row = `${row}<${c.name} class="${c.attribs.class}">${text}</${c.name}>`;
          });
          if (row) stats = `${stats}<div class="${stat.attr('class')}">${row}</div>`;
        }
        if (p.floor_area) {
          const stat = $('[data-group="compare_stat"]').clone();
          let row = '';
          stat.find('> *').each((i, c) => {
            let text = '';
            if (i > 0) {
              text = `${formatValues(p, 'floor_area')}`;
            } else {
              text = 'Floor Area';
            }
            row = `${row}<${c.name} class="${c.attribs.class}">${text}</${c.name}>`;
          });
          if (row) stats = `${stats}<div class="${stat.attr('class')}">${row}</div>`;
        }
        if (p.price_per_sqft) {
          const stat = $('[data-group="compare_stat"]').clone();
          let row = '';
          stat.find('> *').each((i, c) => {
            let text = '';
            if (i > 0) {
              text = `${formatValues(p, 'price_per_sqft')}`;
            } else {
              text = 'Price/Sqft.';
            }
            row = `${row}<${c.name} class="${c.attribs.class}">${text}</${c.name}>`;
          });
          if (row) stats = `${stats}<div class="${stat.attr('class')}">${row}</div>`;
        }
        if (p.listed_at) {
          const stat = $('[data-group="compare_stat"]').clone();
          let row = '';
          stat.find('> *').each((i, c) => {
            let text = '';
            if (i > 0) {
              const [year, month, day] = `${p.listed_at}`.split('-').map(Number);
              text = `${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(year, month - 1, day))}`;
            } else {
              text = 'Date Listed';
            }
            row = `${row}<${c.name} class="${c.attribs.class}">${text}</${c.name}>`;
          });
          if (row) stats = `${stats}<div class="${stat.attr('class')}">${row}</div>`;
        }
        if (p.strata_fee) {
          const stat = $('[data-group="compare_stat"]').clone();
          let row = '';
          stat.find('> *').each((i, c) => {
            let text = '';
            if (i > 0) {
              text = `${formatValues(p, 'strata_fee')}`;
            } else {
              text = 'Strata Fee';
            }
            row = `${row}<${c.name} class="${c.attribs.class}">${text}</${c.name}>`;
          });
          if (row) stats = `${stats}<div class="${stat.attr('class')}">${row}</div>`;
        }

        if (stats) item.find(`.${wrapper_class}`).replaceWith(`<div class="${wrapper_class}">${stats}</div>`);
        item.find('[data-group="compare_stat"]').remove();

        cards = `${cards}<div class="${compare_item.attr('class')}">${item.html()}</div>`;
      });

      $('[data-component="compare_column"]').replaceWith(cards);
      const body = $('body > *');
      let agent = agent_data as unknown as AgentData;
      return <Iterator agent={agent_data}>{domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}</Iterator>;
    }
  } catch (e) {
    console.error(e);
  }
  return <NotFound />;
}
