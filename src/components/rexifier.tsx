/* eslint-disable @next/next/no-img-element */
import Script from 'next/script';
import { ReactElement } from 'react';
import { Cheerio, CheerioAPI } from 'cheerio';
import parse, { HTMLReactParserOptions, Element, attributesToProps, DOMNode, domToReact, htmlToDOM } from 'html-react-parser';

import { HTMLNode } from '@/_typings/elements';
import { AgentData } from '@/_typings/agent';
import { GeoLocation, MapboxBoundaries } from '@/_typings/maps';
import { MLSProperty } from '@/_typings/property';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';

import { combineAndFormatValues, formatValues } from '@/_utilities/data-helpers/property-page';
import { getCityFromGeolocation, getGeocode, getViewPortParamsFromGeolocation } from '@/_utilities/geocoding-helper';

import EmailAnchor from './A/Email';
import FooterSocialLinks from './A/FooterSocialLinks';
import PersonalTitle from './PersonalTitle';
import PersonalBioParagraph from './PersonalBioParagraph';
import PropertyCarousel from './PropertyCarousel/main';
import HomeAlertsReplacer from '@/_replacers/HomeAlerts/home-alerts';
import RxTable from './RxTable';
import RxContactForm from '@/components/RxForms/RxContactForm';
import { RxUserSessionLink } from './Nav/RxUserSessionLink';

// TODO: @Rey, shall we move those next 3 items into "RxProperty", like the last ones in this group?
import { RexifyStatBlock } from './PropertyInformationRow';
import { RexifyPropertyFeatureBlock } from './PropertyFeatureSection';
import PropertyCard from './PropertyCard';
import RxPropertyCarousel from './RxProperty/RxPropertyCarousel';
import RxPropertyTopStats from './RxProperty/RxPropertyTopStats';

// TODO: should RxPropertyMap be under "full-pages"?
import RxPropertyMap from './RxPropertyMap';

import { RxSignupPage } from './full-pages/RxSignupPage';
import { RxLoginPage } from './full-pages/RxLoginPage';
import { RxResetPasswordPage } from './full-pages/RxResetPassword';
import { RxMyAccountPage } from './full-pages/RxMyAccountPage';

async function replaceTargetCityComponents($: CheerioAPI, target_city: string) {
  const result = await getGeocode(target_city);
  if (result && 'place_id' in result) {
    // Result is of a valid Google Geolocation (if it has a place_id)
    const city = getCityFromGeolocation(result);
    const mapbox_boundaries = getViewPortParamsFromGeolocation(result);
    const pin_location = result.geometry.location;
    replaceByCheerio($, '.address-chip:first-child', {
      city,
      mapbox_boundaries,
      pin_location,
    });
  }
}

function replaceSearchHighlights(
  $: CheerioAPI,
  target_child = '.address-chip:nth-child(2)',
  city: string,
  mapbox_boundaries: MapboxBoundaries,
  pin_location: GeoLocation,
) {
  replaceByCheerio($, target_child, {
    city,
    mapbox_boundaries,
    pin_location,
  });
}

export async function fillAgentInfo($: CheerioAPI, agent_data: AgentData) {
  if (agent_data.metatags.target_city) {
    await replaceTargetCityComponents($, agent_data.metatags.target_city);
  }

  if (agent_data.metatags.search_highlights && agent_data.metatags.search_highlights.labels) {
    const areas = agent_data.metatags.search_highlights.labels;

    areas.forEach((area, i) => {
      if (area.ne && area.sw && area.lat && area.lng) {
        replaceSearchHighlights(
          $,
          `.address-chip:nth-child(${i + 2})`,
          area.title,
          {
            nelat: area.ne.lat,
            nelng: area.ne.lng,
            swlat: area.sw.lat,
            swlng: area.sw.lng,
          },
          {
            lat: area.lat,
            lng: area.lng,
          },
        );
      }
    });

    $('.address-chip[href="#"]').replaceWith('');
  }

  if (agent_data.metatags.headshot) {
    replaceByCheerio($, '.little-profile-card img', {
      photo: agent_data.metatags.headshot,
    });
  }

  if (agent_data.metatags.profile_image) {
    replaceByCheerio($, '.agentface', {
      backgroundImage: agent_data.metatags.profile_image,
    });
    replaceByCheerio($, 'img.agentface', {
      photo: agent_data.metatags.profile_image,
    });
  }

  if (agent_data.metatags?.logo_for_light_bg) {
    $('.navbar-wrapper-2 > a').remove();
    replaceByCheerio($, '.navbar-wrapper-2', {
      prepend: `<a href="/" class="flex justify-items-start"><img class="justify-self-start max-h-10" src="${agent_data.metatags.logo_for_light_bg}" /></a>`,
    });
  }
}

export function fillPropertyGrid($: CheerioAPI, properties: MLSProperty[], selector = '.similar-homes-grid') {
  properties.forEach((p: MLSProperty, i) => {
    replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1})`, {
      ['data-mls']: p.MLS_ID,
    });

    // Photo
    replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1}) > .propcard-image`, {
      backgroundImage: (p.photos as string[])[0],
    });

    // Area
    replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1}) .area-text`, {
      content: p.Area,
    });

    // Price
    replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1}) .propcard-price`, {
      content: `${formatValues(p, 'AskingPrice')}`,
    });

    // Address
    replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1}) .propcard-address`, {
      content: `${formatValues(p, 'Address')}`,
    });

    // Beds
    replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1}) .bedroom-stat`, {
      content: `${formatValues(p, 'L_BedroomTotal') || '1'}`,
    });

    // Baths
    if (p.L_TotalBaths) {
      replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1}) .bath-stat`, {
        content: `${formatValues(p, 'L_TotalBaths')}`,
      });
    } else {
      removeSection($, `${selector} > .property-card-map:nth-child(${i + 1}) .bath-stat`, '.propertycard-feature');
    }

    // Sqft
    replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1}) .sqft-stat`, {
      content: `${formatValues(p, 'L_FloorArea_Total')}`,
    });

    // Year
    replaceByCheerio($, `${selector} > .property-card-map:nth-child(${i + 1}) .year-stat`, {
      content: `${formatValues(p, 'L_YearBuilt')}`,
    });
  });
}

type ReplacementOptions = {
  backgroundImage?: string;
  content?: string;
  prepend?: string;
  ['data-mls']?: string;
  city?: string;
  mapbox_boundaries?: MapboxBoundaries;
  inline_style?: string;
  photo?: string;
  pin_location?: GeoLocation;
};
export function replaceByCheerio($: CheerioAPI, target: string, replacement: ReplacementOptions) {
  if (replacement && Object.keys(replacement).length) {
    if (target.indexOf('.propcard-image') >= 0) {
      const styles: string[] = [];
      if (replacement.backgroundImage) {
        styles.push(`background-image: url(${replacement.backgroundImage})`);
      }

      if (styles.length > 0) {
        $(target).attr('style', styles.join('; '));
      }
    } else if (replacement.backgroundImage) {
      $(target).attr('style', `background-image: url(${replacement.backgroundImage}); background-repeat: no-repeat;`);
    } else if (replacement.photo) {
      $(target).attr('src', replacement.photo);
      $(target).removeAttr('srcset');
    } else if (replacement.content) {
      // Replace the whole tag
      $(target).html(replacement.content);
    } else if (replacement.prepend) {
      // Prepends child content
      $(target).prepend(replacement.prepend);
    } else if (replacement['data-mls']) {
      $(target).attr('data-mls', replacement['data-mls']);
    } else if (replacement.city && replacement.pin_location && replacement.mapbox_boundaries) {
      const query_params = [
        `nelat=${replacement.mapbox_boundaries.nelat}`,
        `nelng=${replacement.mapbox_boundaries.nelng}`,
        `swlat=${replacement.mapbox_boundaries.swlat}`,
        `swlng=${replacement.mapbox_boundaries.swlng}`,
        `lat=${replacement.pin_location.lat}`,
        `lng=${replacement.pin_location.lng}`,
        `city=${encodeURIComponent(replacement.city)}`,
      ];
      $(target).attr('href', `/map?${query_params.join('&')}`);
      $(target).text(replacement.city);
    }
  }
}

/**
 * Removes a placeholder section from the page
 * @param $
 * @param target className
 * @param parentClass className
 */
export function removeSection($: CheerioAPI, target: string, parentClass = '.wf-section') {
  const [parent] = $(target).parents(parentClass) as unknown as Cheerio<Element>[];
  if (parent) {
    $(parent).remove();
  }
}

export function replaceInlineScripts($: CheerioAPI) {
  $('script:not([src])').each((index, scrpt) => {
    $(scrpt).remove();
  });
}

export function replaceFormsWithDiv($: CheerioAPI) {}

/**
 *
 * @param html_code
 * @param agent_data
 * @returns
 */
export function rexify(html_code: string, agent_data: AgentData, property: Record<string, unknown> = {}) {
  // Parse and replace
  let home_alert_index = 1;
  const options: HTMLReactParserOptions = {
    replace: node => {
      // Take out script / replace DOM placeholders with our Reidget
      if (node.type === 'script') {
        const { attribs } = node as unknown as {
          attribs: Record<string, string>;
        };

        if (attribs.src) {
          const { pathname } = new URL(attribs.src);

          return (
            <>
              <Script
                id={pathname.split('/').pop()}
                dangerouslySetInnerHTML={{
                  __html: `
                    var script = document.createElement('script');
                    ${pathname.indexOf('webflow') >= 0 ? 'script.defer = true;' : 'script.async = true;'}
                    script.src = '${attribs.src}';

                    script.onload = () => {
                        console.log('${attribs.src}', '${pathname.split('/').pop()} loaded')
                        setTimeout(() => {
                            const badge = document.querySelector('.w-webflow-badge')
                            if (badge) {
                                badge.remove();
                                console.log('badge found and removed');
                            }
                        }, 1200)
                    }
                    
                    ${attribs.src.indexOf('jquery') ? 'document.body.appendChild(script);' : ''}
                  `,
                }}
              />
            </>
          );
        } else {
          if ((node as Element).children) {
            // Scripts that are inline...
            // Debugging purposes
            const { data } = (node as Element).children[0] as {
              data: string;
            };
            if (data) {
              try {
                const property_image: {
                  group: 'Property Images';
                  items: {
                    url: string;
                    type: string;
                  }[];
                } = JSON.parse(data);
                if (property_image.group === 'Property Images' && property_image.items[0]?.url) {
                  return <div data-carousel-photo={property_image.items[0].url}></div>;
                }
              } catch (e) {
                console.log('Not an image. Not to be worried about for now');
                console.log(e);
              }
            }
            return <script dangerouslySetInnerHTML={{ __html: data }} type='application/json' />;

            return <></>;
          }
        }
      } else if (node instanceof Element && node.attribs) {
        const { class: className, ...props } = attributesToProps(node.attribs);

        if (node.attribs?.['data-wf-user-form-type'] === WEBFLOW_NODE_SELECTOR.SIGNUP) {
          return (
            <RxSignupPage {...props} agent={agent_data.id as number} logo={agent_data.metatags?.logo_for_light_bg} type={node.type}>
              <>{domToReact(node.children) as ReactElement[]}</>
            </RxSignupPage>
          );
        }
        if (node.attribs?.['data-wf-user-form-type'] === WEBFLOW_NODE_SELECTOR.LOGIN) {
          return (
            <RxLoginPage {...props} type={node.type}>
              <>{domToReact(node.children) as ReactElement[]}</>
            </RxLoginPage>
          );
        }
        if (node.attribs?.['data-wf-user-form-type'] === WEBFLOW_NODE_SELECTOR.RESET_PASSWORD) {
          return (
            <RxResetPasswordPage {...props} type={node.type}>
              <>{domToReact(node.children) as ReactElement[]}</>
            </RxResetPasswordPage>
          );
        }

        if (node.tagName === 'form') {
          return (
            <div {...props} id='rex-form' data-class={className}>
              {domToReact(node.children) as ReactElement[]}
            </div>
          );
        }

        if (node.attribs.class) {
          if (node.attribs.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.MY_ACCOUNT_WRAPPER)) {
            return (
              <RxMyAccountPage {...props} type={node.type} data={agent_data}>
                <>{domToReact(node.children) as ReactElement[]}</>
              </RxMyAccountPage>
            );
          }

          if (
            node.attribs.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.USER_MENU) ||
            node.attribs.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.GUEST_MENU)
          ) {
            return (
              <RxUserSessionLink {...props} className={node.attribs.class} href={node.attribs.href}>
                <>{domToReact(node.children) as ReactElement[]}</>
              </RxUserSessionLink>
            );
          }
        }

        if (props['data-mls']) {
          return (
            <PropertyCard
              className={className || ''}
              data={{
                mls: props['data-mls'],
              }}
            >
              {domToReact(node.children) as ReactElement[]}
            </PropertyCard>
          );
        }

        if (node.attribs['data-type'] === 'email' && node.tagName === 'a') {
          // Emai link
          return <EmailAnchor {...props} agent={agent_data} />;
        }

        if (node.attribs['data-type'] === 'personal_title') {
          // Personal title on top of the home page (hero)
          return <PersonalTitle {...props} agent={agent_data} />;
        }

        if (node.attribs['data-type'] === 'personal_bio') {
          // Personal bio <p>
          return <PersonalBioParagraph {...props} agent={agent_data} />;
        }

        if (node.attribs.class && node.attribs.class.indexOf('li-property') >= 0) {
          return <PropertyCarousel {...props} agent={agent_data} />;
        }
        /**
         * This is where the magic happens
         */
        if (node.attribs.class === 'map-div') {
          // Mapbox Voodoo here
          // Check for improvement
          return (
            <div className={node.attribs.class} id='MapDiv'>
              <RxPropertyMap
                agent_data={agent_data}
                listings={[]}
                config={{
                  authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString(
                    'base64',
                  )}`,
                  url: process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
                }}
              >
                {domToReact(node.children) as ReactElement[]}
              </RxPropertyMap>
            </div>
          );
        }
        if (node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.HOME_ALERTS_WRAPPER) >= 0) {
          return <HomeAlertsReplacer agent={agent_data} nodeClassName={className} nodeProps={props} nodes={domToReact(node.children) as ReactElement[]} />;
        }
        if (node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.CONTACT_FORM) >= 0) {
          return <RxContactForm agent={agent_data} nodeClassName={node.attribs.class} nodeProps={props} nodes={domToReact(node.children) as ReactElement[]} />;
        }
        if (node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.FOOTER_SOCIAL_LINKS) >= 0) {
          return (
            <FooterSocialLinks agent={agent_data} nodeClassName={node.attribs.class} nodeProps={props} nodes={domToReact(node.children) as ReactElement[]} />
          );
        }

        if ((node.children && node.children.length === 1) || node.name === 'input') {
          const reX = rexifyOrSkip(
            node.children[0],
            {
              ...(property && Object.keys(property).length ? property : {}),
              agent_data,
            },
            node.attribs.class,
            node.name,
          );
          if (reX) return reX;
        }

        if (property && Object.keys(property).length) {
          const record = property as unknown as MLSProperty;
          if (node.attribs && node.attribs.class) {
            // Property images
            if (node.attribs.class === 'section---top-images wf-section') {
              return (
                <section className={node.attribs.class}>
                  <RxPropertyCarousel>{domToReact(node.children)}</RxPropertyCarousel>
                </section>
              );
            }

            // Property action buttons (PDF, Share links, etc)
            if (node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_STATS) >= 0) {
              return (
                <RxPropertyTopStats property={record} className={node.attribs.class}>
                  {domToReact(node.children)}
                </RxPropertyTopStats>
              );
            }

            // Grouped data table sections
            // Property Information, Financial, Dimensions, Construction
            if (node.attribs.class.indexOf('propinfo') >= 0) return <RexifyStatBlock node={node} record={record} groupName='propinfo' />;
            else if (node.attribs.class.indexOf('financial') >= 0) return <RexifyStatBlock node={node} record={record} groupName='financial' />;
            else if (node.attribs.class.indexOf('dimensions') >= 0) return <RexifyStatBlock node={node} record={record} groupName='dimensions' />;
            else if (node.attribs.class.indexOf('construction') >= 0) return <RexifyStatBlock node={node} record={record} groupName='construction' />;
            else if (node.attribs.class.indexOf('div-features-block') >= 0) {
              return <RexifyPropertyFeatureBlock node={node} record={record} />;
            }
            // Building units section
            else if (node.lastChild && (node.lastChild as HTMLNode).attribs && (node.lastChild as HTMLNode).attribs.class) {
              const child_class = (node.lastChild as HTMLNode).attribs.class;
              if (child_class.indexOf('div-building-units-on-sale') >= 0 && node.attribs.class.indexOf('building-and-sold-column') >= 0) {
                return property.neighbours && (property.neighbours as MLSProperty[]).length ? (
                  property.AddressUnit ? (
                    <RxTable rows={node.children} data={property.neighbours as MLSProperty[]} rowClassName='div-building-units-on-sale' />
                  ) : (
                    <></>
                  )
                ) : (
                  <></>
                );
              } // Sold history
              else if (child_class.indexOf('div-sold-history') >= 0 && node.attribs.class.indexOf('building-and-sold-column') >= 0) {
                return property.sold_history && (property.sold_history as MLSProperty[]).length ? (
                  <RxTable rowClassName='div-sold-history' rows={node.children} data={property.sold_history as MLSProperty[]} />
                ) : (
                  <></>
                );
              }
            }
          }
        }
      }
    },
  };

  const elements = parse(html_code, options);

  return elements;
}

export function injectLogo(tagName: string, className: string, agent_data: AgentData): string {
  if (className.indexOf('logo-dark') >= 0 && agent_data.metatags?.logo_for_light_bg) {
    const styles = [
      `background-image: url(${agent_data.metatags?.logo_for_light_bg})`,
      `background-size: 'contain'`,
      `background-repeat: 'no-repeat'`,
      'flex: 1',
      `display: 'flex'`,
    ];
    return `<h3
        class="${className}"
        style="${styles.join('; ')}"
      >
        <a
          href='/'
          style="display: inline-block; opacity: 0; width: 100%; textIndent: -100em"
        >
          ${agent_data.full_name || '{Agent Name}'}
        </a>
      </h3>`;
  }
  return `<${tagName || 'span'} class="${className}">${agent_data.full_name}</${tagName || 'span'}>`;
}

function rexifyOrSkip(element: DOMNode, record: unknown, className = '', tagName = ''): ReactElement | undefined {
  const { agent_data } = record as { agent_data: AgentData };
  if (!element) return;
  const { data: placeholder } = element as { data: string };
  if (agent_data) {
    if (placeholder === '{Bio Title}' || placeholder === '{Agent Title}') {
      if (agent_data.metatags?.personal_title) {
        switch (tagName) {
          case 'h1':
            return <h1 className={className}>{agent_data.metatags?.personal_title}</h1>;
          default:
            return <span className={className}>{agent_data.metatags?.personal_title}</span>;
        }
      }
    }
    if (placeholder === '{Bio}') {
      if (agent_data.metatags?.personal_bio) {
        return (
          <p className={className} style={{ whiteSpace: 'pre-line' }}>
            {agent_data.metatags?.personal_bio.split('\n').map((text, i) => {
              return (
                <span key={`bio-${i + 1}`}>
                  {text}
                  <br />
                  <br />
                </span>
              );
            })}
          </p>
        );
      }
    }
    if (placeholder === '{Agent Name}') {
      if (agent_data.full_name) {
        return (
          <>
            {domToReact(
              htmlToDOM(
                `<${tagName || 'span'}
            class="${className}"
          >
            ${agent_data.full_name}
          </${tagName || 'span'}>`,
              ),
            )}
          </>
        );
      }
    }
    if (className.indexOf('phone-link-blockj') >= 0) {
      return (
        <a href={`tel:${agent_data.phone.replace(/[^0-9.]/g, '')}`} className={className}>
          {agent_data.phone}
        </a>
      );
    } else if (placeholder === '{Agent Phone Number}') {
      const { name: TagName } = element.parent as { name: string };
      switch (TagName) {
        case 'div':
          return <div className={className}>{agent_data.phone}</div>;
        default:
          return <span className={className}>{agent_data.phone}</span>;
      }
    } else if (placeholder === '{Agent Email}') {
      const { name: TagName } = element.parent as { name: string };
      switch (TagName) {
        case 'div':
          return <div className={className}>{agent_data.email}</div>;
        default:
          return <span className={className}>{agent_data.email}</span>;
      }
    }
  }
  const property = record as MLSProperty;
  switch (placeholder) {
    case '{Description}':
      return <p className={className}>{property.L_PublicRemakrs}</p>;

    case '{Sqft}':
      return <p className={className}>{new Intl.NumberFormat(undefined).format(property.L_LotSize_SqMtrs)}</p>;

    case '{Baths}':
      return <p className={className}>{property.L_TotalBaths}</p>;

    case '{Beds}':
      return <p className={className}>{property.L_BedroomTotal}</p>;

    case '{Year Built}':
      return <p className={className}>{property.L_YearBuilt}</p>;

    case '{Area}':
      return <p className={className}>{property.Area}</p>;

    case '{Address}':
      return <div className={className}>{property.Address}</div>;

    case '{Building Type}':
      return <div className={className}>{property.PropertyType}</div>;

    case '{Lot Size}':
      return <div className={className}>{formatValues(property, 'L_LotSize_SqMtrs')}</div>;

    case '{MLS Number}':
      return <span className={className}>{property.MLS_ID}</span>;

    case '{Land Title}':
      return <span className={className}>{property.LandTitle}</span>;

    case '{Price Per Sqft}':
      return <span className={className}>{formatValues(property, 'PricePerSQFT')}</span>;

    case '{Price}':
      return <div className={className}>{formatValues(property, 'AskingPrice')}</div>;

    case '{Property Tax}':
      return (
        <span className={className}>
          {combineAndFormatValues({
            L_GrossTaxes: property.L_GrossTaxes,
            ForTaxYear: property.ForTaxYear,
          })}
        </span>
      );
  }
}
