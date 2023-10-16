import { Children, ReactElement, cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { POST as getPipelineSample } from '@/app/api/pipeline/route';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { NextRequest } from 'next/server';
import { must_not } from '@/_utilities/api-calls/call-legacy-search';
import { PropertyDataModel } from '@/_typings/property';
import styles from './profile-page.module.scss';
import NavIterator from '@/components/Nav/RxNavIterator';
import FooterIterator from '@/components/RxFooter';
import { objectToQueryString } from '@/_utilities/url-helper';
import HomePageSearchInput from './search-input.component';
import ActionButton from './homepage-action-button.module';
import RxNotifications from '@/components/RxNotifications';
import { PropertyCard } from './property-card.component';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const agent = await findAgentRecordByAgentId(params.slug);
  if (agent.id) {
    const { metatags } = agent as unknown as AgentData;
    console.log(JSON.stringify(metatags, null, 4));
    console.log(metatags.favicon);
    return {
      title: metatags.title,
      icons: metatags.favicon,
    };
  }
  return {
    title: params.slug,
  };
}

function Iterator({
  agent,
  children,
  listings,
}: {
  agent: AgentData;
  children: ReactElement;
  listings?: { active: PropertyDataModel[]; sold: PropertyDataModel[] };
}) {
  const Wrapped = Children.map(children, c => {
    if (c.type === 'input' && c.props.type === 'search') return <HomePageSearchInput {...c.props} />;
    else if (c.type !== 'a' && c.props?.children && typeof c.props?.children !== 'string') {
      const { children: sub, ...props } = c.props;
      if (props.className?.includes('property-card') && listings?.active) {
        return (
          <>
            {listings.active.map(l => (
              <div {...props} key={l.mls_id}>
                <PropertyCard agent={agent} listing={l}>
                  {sub}
                </PropertyCard>
              </div>
            ))}
          </>
        );
      }
      if (props['data-rx'] === 'sold-listing' && listings?.sold) {
        return (
          <>
            {listings.sold.map(l => (
              <div {...props} key={l.mls_id}>
                <PropertyCard agent={agent} listing={l}>
                  {sub}
                </PropertyCard>
              </div>
            ))}
          </>
        );
      }
      if (props.className?.split(' ').includes('navigation')) {
        return (
          <NavIterator agent={agent}>
            <div {...props}>{sub}</div>
          </NavIterator>
        );
      }
      if (props.className === 'f-footer-small') {
        return <FooterIterator agent={agent}>{sub}</FooterIterator>;
      }
      return (
        <div {...props}>
          <Iterator agent={agent} listings={listings}>
            {sub}
          </Iterator>
        </div>
      );
    } else if (c.type === 'a' && c.props.href && c.props.href !== '#') {
      const href = !agent.domain_name ? `/${agent.agent_id}/${agent.metatags.profile_slug}/${c.props.href.split('/').pop()}` : c.props.href;
      return (
        <a {...c.props} href={href}>
          {typeof c.props?.children !== 'string' ? (
            <Iterator agent={agent} listings={listings}>
              {c.props.children}
            </Iterator>
          ) : (
            c.props.children
          )}
        </a>
      );
    }

    if (c.props) {
      if (!agent) {
        return c;
      }

      if (c.props['data-action']) {
        if (c.props['data-action'].includes('request_info')) {
          return (
            <ActionButton className={c.props.className + ' rexified-action-button'} data-action={c.props['data-action']}>
              {c.props.children}
            </ActionButton>
          );
        }
      }

      if (c.props['data-field']) {
        switch (c.props['data-field']) {
          case 'agent_name':
            return cloneElement(c, c.props, agent.full_name);
          case 'personal_title':
            return cloneElement(c, c.props, agent.metatags?.personal_title || 'Your realtor');
          case 'personal_bio':
            return cloneElement(
              c,
              c.props,
              agent.metatags?.personal_bio ||
                `${c.props.children}`
                  .split('[number of years]')
                  .join('10 years')
                  .split(`[Realtor's Name]`)
                  .join('our team')
                  .split('Vancouver')
                  .join(agent.metatags.target_city),
            );
          case 'profile_image':
            if (agent.metatags?.profile_image)
              return cloneElement(<div />, {
                ...c.props,
                className: classNames(c.props.className || '', 'w-height aspect-square bg-cover bg-center'),
                style: {
                  backgroundImage: `url(${getImageSized(agent.metatags.profile_image, 629 * 2)})`,
                  width: '629px',
                },
                srcset: undefined,
                sizes: undefined,
              });
            break;
          case 'headshot':
            if (agent.metatags?.headshot)
              return cloneElement(<div />, {
                ...c.props,
                className: classNames(c.props.className || '', 'w-height aspect-square bg-cover bg-center'),
                style: {
                  backgroundImage: `url(${getImageSized(agent.metatags.headshot, 500 * 2)})`,
                  width: '500px',
                },
                srcset: undefined,
                sizes: undefined,
              });
            break;
          case 'search_highlight_button':
            if (agent.metatags?.search_highlights) {
              const { labels } = agent.metatags.search_highlights as unknown as {
                labels: {
                  title: string;
                  lat: number;
                  lng: number;
                }[];
              };
              if (labels && labels.length)
                return (
                  <>
                    {labels.map(l => {
                      return cloneElement(
                        c,
                        {
                          ...c.props,
                          key: `${l.title}&lat=${l.lat}`,
                          href: `${agent.metatags.profile_slug}/map?city=${l.title}&lat=${l.lat}&lng=${l.lng}`,
                        },
                        l.title,
                      );
                    })}
                  </>
                );
            }
            return <></>;
          case 'target_city':
            if (agent.metatags?.target_city) {
              return cloneElement(c, {}, agent.metatags.target_city);
            }
          case 'target_map':
            if (agent.metatags) {
              return (
                <div
                  className={'bg-cover bg-center h-full w-full ' + c.props.className}
                  style={{
                    backgroundImage: `url(https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${`${agent.metatags.lng || -123.112},${
                      agent.metatags.lat || 49.2768
                    },11/1080x720@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`})`,
                  }}
                />
              );
            }
          default:
            let rexified = (agent as unknown as { [key: string]: string })[c.props['data-field']];
            if (!rexified) {
              rexified = (agent.metatags as unknown as { [key: string]: string })[c.props['data-field']];
              if (c.type === 'img')
                return cloneElement(c, {
                  src: c.props['data-field'].indexOf('logo_') === 0 ? getImageSized(rexified, 230) : rexified,
                });
            }

            if (!rexified) {
              if (c.props['data-field'].includes('search_highlight_button')) {
                const buttons = agent.metatags.search_highlights?.labels?.map((target, idx) => {
                  const { children: search_btn_elements, ...search_btn_props } = c.props;
                  const { ne, sw, ...geo } = target;
                  let url_path = `/${agent.agent_id}/${agent.metatags.profile_slug}`;
                  if (agent.domain_name) url_path = ``;
                  const q = ne && sw ? `&nelat=${ne.lat}&nelng=${ne.lng}&swlat=${sw.lat}&swlng=${sw.lng}` : '';

                  return (
                    <a
                      {...search_btn_props}
                      key={`${url_path}-${idx}`}
                      href={`${url_path}/map?${objectToQueryString(
                        {
                          ...geo,
                          city: geo.name,
                        },
                        ['title', 'name'],
                      )}&minprice=200000&maxprice=100000000`}
                    >
                      {Children.map(search_btn_elements, cc => (
                        <span className={cc.className}>{target.name}</span>
                      ))}
                    </a>
                  );
                });
                return <>{buttons}</>;
              }
            }

            if (rexified) return cloneElement(c, c.props, rexified);
        }
      }
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default async function AgentHomePage({ params, searchParams }: { params: { slug: string }; searchParams: { [k: string]: string } }) {
  const { slug: agent_id } = params;
  if (agent_id) {
    const agent = await findAgentRecordByAgentId(agent_id);
    let webflow_site = `https://${WEBFLOW_DASHBOARDS.CUSTOMER}`;
    if (!agent) return '';
    if (searchParams.theme) {
      webflow_site = `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${searchParams.theme}-leagent.webflow.io/index.html`;
    } else if (agent.domain_name) webflow_site = `https://${agent.domain_name}`;
    else if (agent.webflow_domain) webflow_site = `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${agent.webflow_domain}/index.html`;

    const promises = await Promise.all([axios.get(webflow_site)]);
    const { data: html } = promises[0];
    const $: CheerioAPI = load(html);

    let filter = [] as unknown[];
    let should = [
      {
        match: {
          'data.LA1_LoginName': agent_id,
        },
      },
      {
        match: {
          'data.LA2_LoginName': agent_id,
        },
      },
      {
        match: {
          'data.LA3_LoginName': agent_id,
        },
      },
    ] as unknown[];
    if (agent.metatags?.search_highlights?.labels) {
      const { labels } = agent.metatags.search_highlights as unknown as {
        labels: {
          ne: {
            lat: number;
            lng: number;
          };
          sw: {
            lat: number;
            lng: number;
          };
          title: string;
        }[];
      };
      if (labels.length) {
        let max_lat = -999,
          min_lat = -999,
          max_lng = -999,
          min_lng = -999;
        labels.forEach(l => {
          should = should.concat([
            {
              match: { 'data.Area': l.title },
            },
          ]);
          if (max_lat === -999 || max_lat < l.ne.lat) {
            max_lat = l.ne.lat;
          }
          if (max_lng === -999 || max_lng < l.ne.lng) {
            max_lng = l.ne.lng;
          }
          if (min_lat === -999 || min_lat > l.sw.lat) {
            min_lat = l.sw.lat;
          }
          if (min_lng === -999 || min_lng > l.sw.lng) {
            min_lng = l.sw.lng;
          }
        });
        filter = filter.concat([
          {
            range: {
              'data.lat': {
                lte: max_lat,
                gte: min_lat,
              },
            },
          },
          {
            range: {
              'data.lng': {
                lte: max_lng,
                gte: min_lng,
              },
            },
          },
        ]);
      }
    }

    const internal_req = {
      json() {
        return {
          from: 0,
          size: 3,
          sort: {
            'data.UpdateDate': 'desc',
          },
          query: {
            bool: {
              filter: filter.concat([
                {
                  match: {
                    'data.Status': 'Active',
                  },
                },
              ]),
              should,
              minimum_should_match: 1,
              must_not,
            },
          },
        } as LegacySearchPayload;
      },
    } as unknown as NextRequest;
    const intsold_req = {
      json() {
        return {
          from: 0,
          size: 2,
          sort: {
            'data.UpdateDate': 'desc',
          },
          query: {
            bool: {
              filter: filter.concat([
                {
                  match: {
                    'data.Status': 'Sold',
                  },
                },
              ]),
              should,
              minimum_should_match: 1,
              must_not,
            },
          },
        } as LegacySearchPayload;
      },
    } as unknown as NextRequest;

    const [active, sold] = await Promise.all([getPipelineSample(internal_req, { internal: true }), getPipelineSample(intsold_req, { internal: true })]);

    $('[data-field="search_highlights"]:not(:first-child)').remove();
    $('.property-card:not(:first-child)').remove();
    $('[data-rx="sold-listing"]:not(:first-child)').each((i, el) => {
      $(el).addClass(styles['hidden-card']);
    });
    if (sold) {
      const listings = sold as PropertyDataModel[];
      if (listings.length === 0) $('[data-rx-section="sold"]').remove();
    }

    const navbar = $('body .navbar-component');
    $('body .navbar-component').remove();
    const body = $('body > div,section');

    return (
      <>
        <NavIterator agent={agent}>{domToReact(navbar as unknown as DOMNode[]) as unknown as ReactElement}</NavIterator>
        <Iterator
          agent={agent}
          listings={{
            active: (active || []) as unknown[] as PropertyDataModel[],
            sold: (sold || []) as unknown[] as PropertyDataModel[],
          }}
        >
          {domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}
        </Iterator>
        <RxNotifications />
      </>
    );
  }
  return <></>;
}

// export default DefaultPage;
