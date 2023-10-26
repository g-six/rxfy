import NotFound from '@/app/not-found';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
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
import { cookies } from 'next/headers';
import { getGeocode, getViewPortParamsFromGeolocation } from '@/_utilities/geocoding-helper';

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

    const themes = ['oslo', 'default', 'lisbon', 'alicante'];
    if (html && profile_slug) {
      const $: CheerioAPI = load(html);
      $('.btn-stripe-buy').attr('href', `${process.env.NEXT_PUBLIC_BUY_BUTTON}`);
      themes.map((preview, idx) => {
        // previews.map((preview, idx) => {
        //   $(`[data-group="themes"] div:nth-child(${idx + 1})`).html(`<img src="${preview.url}" class="w-full" />`);
        $('[data-group="themes"]').attr('style', 'overflow-y: hidden; padding: 0');
        $(`[data-group="themes"] > div:nth-child(${idx + 1})`).attr('data-theme', themes[idx]);
        $(`[data-group="themes"] > div:nth-child(${idx + 1})`).attr('style', 'padding: 0;');
        $(`[data-group="themes"] > div:nth-child(${idx + 1}) > div`).replaceWith(
          `<div class="flex w-full h-full flex-col" style="width: 100%" data-theme-contents="${themes[idx]}" />`,
        );
      });

      if (cookies().get('session_key')?.value) {
        $('[data-group="out_session"]').remove();
        if (agent_data.id) {
          let class_name = $('[data-group="in_session"] [data-field="full_name"]').attr('class');
          $('[data-group="in_session"] [data-field="full_name"]').replaceWith(`<div class="${class_name}">${agent_data.full_name}</div>`);

          class_name = $('[data-group="in_session"] [data-field="phone"]').attr('class');
          $('[data-field="phone"]').replaceWith(`<div class="${class_name}"><a href="tel:${agent_data.phone}">${agent_data.phone}</a></div>`);

          class_name = $('[data-group="in_session"] [data-field="email"]').attr('class');
          $('[data-field="email"]').replaceWith(`<div class="${class_name}"><a href="mailto:${agent_data.email}">${agent_data.email}</a></div>`);

          class_name = $('[data-group="in_session"] [data-field="domain_name"]').attr('class');

          if (agent_data.metatags.headshot) {
            class_name = $('[data-group="in_session"] [data-field="headshot"]').attr('class');
            $('[data-group="in_session"] [data-field="headshot"]').replaceWith(
              `<div class="${class_name} bg-contain bg-center" style="background-image: url(${getImageSized(agent_data.metatags.headshot, 100)})"></div>`,
            );
          }
        }
      } else {
        $('[data-group="in_session"]').remove();
      }

      $('[data-text]').each((i, el) => {
        const class_name = el.attribs.class;
        const field = el.attribs['data-text'];
        let value = agent_data[field] || agent_data.metatags[field];
        if (field === 'domain_name' && !value) {
          value = `https://leagent.com/${agent_data.agent_id}/${agent_data.metatags.profile_slug}`;
        }
        if (el.tagName === 'img' && value) {
          const props: string[] = [];
          el.attributes.forEach(attr => {
            if (attr.name !== 'src') props.push(`${attr.name}="${attr.value}"`);
          });
          $(el).replaceWith(`<${el.tagName} ${props.join(' ')} src=${value} />`);
        } else $(el).replaceWith(`<${el.tagName} class="${class_name}">${value}</${el.tagName}>`);
      });
      $('[data-group="business_card_front"] [data-field], [data-group="business_card_back"] [data-field]').each((i, el) => {
        const class_name = el.attribs.class;
        const field = el.attribs['data-field'];
        let value = agent_data[field] || agent_data.metatags[field];
        if (field === 'domain_name' && !value) {
          value = `https://leagent.com/${agent_data.agent_id}/${agent_data.metatags.profile_slug}`;
        }
        if (value) {
          if (el.tagName === 'img') {
            $(el).replaceWith(`<${el.tagName} class="${class_name}" src="${value}" />`);
          }
        }
      });

      // Links
      $('[data-group="facebook_cover"] [data-field], [data-group="email_signature"] [data-field]').each((i, el) => {
        let value = agent_data[el.attribs['data-field']] || agent_data.metatags[el.attribs['data-field']];
        if (el.attribs['data-field'] === 'domain_name' && !value) value = 'leagent.com';
        if (el.attribs['data-field']) {
          const attribs = el.attributes;
          const props: string[] = [];
          attribs.forEach(attr => {
            if (attr.name !== 'src') props.push(`${attr.name}="${attr.value}"`);
          });
          if (el.attribs['data-field'].includes('_url')) {
            if (value) $(el).wrapInner(`<a href="//${value}"></a>`);
            else $(el).remove();
          } else {
            if (value) {
              if (el.tagName === 'img') $(el).replaceWith(`<${el.tagName} ${props.join(' ')} src="${getImageSized(value, 400)}" />`);
              else {
                if (!['headshot', 'logo_for_dark_bg'].includes(el.attribs['data-field']))
                  $(el).replaceWith(`<${el.tagName} ${props.join(' ')}>${value}</${el.tagName}>`);
              }
            }
          }
        }
      });

      const compare_item = $('[data-component="compare_column"]');
      let cards = '';
      let { geocoding, lat, lng } = agent_data.metatags;
      if (!geocoding) {
        const geolocation = await getGeocode(agent_data.metatags.target_city);
        if (geolocation?.place_id) {
          const coords = await getViewPortParamsFromGeolocation(geolocation);

          geocoding = {
            ...coords,
            lat: geolocation?.geometry.location.lat,
            lng: geolocation?.geometry.location.lng,
          };
        }
      }
      let property = undefined;
      if (geocoding) {
        const listings = await getSampleListings(params.id, geocoding, 7);
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
        property = cards_data.filter((p: PropertyDataModel) => p.photos?.length && p.photos.length > 3)[0] || cards_data[0];

        cards_data
          .filter((p: PropertyDataModel) => p.photos?.length && p.photos.length > 3)
          .forEach((p: PropertyDataModel, idx) => {
            if (idx > 2) return;
            let item = compare_item.clone();
            item.find('[data-field]').each((i, el) => {
              switch (el.attribs['data-field']) {
                case 'address':
                  $(el).replaceWith(`<${el.name} class="${$(el).attr('class')}">${formatValues(p, 'title')}</${el.name}>`);
                case 'cover_photo':
                  if (p.cover_photo) {
                    $(el).replaceWith(
                      `<div data-mls="${p.mls_id}" class="${$(el).attr('class')}" style="background-image: url(${p.cover_photo})">${$(el).html()}</div>`,
                    );
                  } else if (p.id && p.photos?.length) {
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
              try {
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
              } catch (e) {
                console.error('Date Listed parsing error', p.listed_at);
              }
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
      }

      $('.tabs-content [data-w-tab="Listings Map"]').attr('style', 'width: 100%; height: 100%; pointer-events: none;');

      $('.tabs-content [data-w-tab="Listings Map"]').wrapInner(
        `<iframe src="/${params.id}/${profile_slug}/map?${objectToQueryString({
          ...geocoding,
          lat,
          lng,
        })}" class="w-full h-full" />`,
      );

      $('.tabs-content [data-w-tab="PDF Brochure"] > *').replaceWith(
        `<iframe src="/api/pdf/mls/${property?.mls_id || 'R2814552'}?agent=${params.id}&slug=${profile_slug}" class="w-full h-full" />`,
      );

      const body = $('body > *');
      let agent = agent_data as unknown as AgentData;
      return (
        <Iterator agent={agent_data} property={property}>
          {domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}
        </Iterator>
      );
    }
  } catch (e) {
    console.error(e);
  }
  return <NotFound />;
}
