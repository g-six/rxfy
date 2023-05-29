/* eslint-disable @next/next/no-sync-scripts */
/* eslint-disable @next/next/no-img-element */
import { Children, ReactElement } from 'react';
import { Cheerio, CheerioAPI } from 'cheerio';
import parse, { HTMLReactParserOptions, Element, attributesToProps, DOMNode, domToReact, htmlToDOM } from 'html-react-parser';

import { AgentData } from '@/_typings/agent';
import { Events } from '@/_typings/events';
import { GeoLocation, MapboxBoundaries } from '@/_typings/maps';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';

import { combineAndFormatValues, formatValues } from '@/_utilities/data-helpers/property-page';
import { getCityFromGeolocation, getGeocode, getViewPortParamsFromGeolocation } from '@/_utilities/geocoding-helper';

import EmailAnchor from './A/Email';
import FooterSocialLinks from './A/FooterSocialLinks';
import PersonalTitle from './PersonalTitle';
import PersonalBioParagraph from './PersonalBioParagraph';
import PropertyCarousel from './RxPropertyCarousel/main';
import HomeAlertsReplacer from '@/_replacers/HomeAlerts/home-alerts';
import RxContactForm from '@/components/RxForms/RxContactForm';
import { RxUserSessionLink } from './Nav/RxUserSessionLink';
import RxPdfWrapper from '@/components/RxProperty/RxPropertyPdf/RxPdfWrapper';

// TODO: should RxPropertyMap be under "full-pages"?
import RxPropertyMap from './RxPropertyMap';

import { RxSignupPage } from './full-pages/RxSignupPage';
import { RxLoginPage } from './full-pages/RxLoginPage';
import { RxResetPasswordPage } from './full-pages/RxResetPassword';
import { RxUpdatePasswordPage } from './full-pages/RxUpdatePassword';
import { RxMyAccountPage } from './full-pages/RxMyAccountPage';
import { RxDetailedListing } from './full-pages/RxDetailedListing';
import { RxMyClients } from './full-pages/RxMyClients';
import DocumentsReplacer from '@/_replacers/Documents/documents';
import RxMyCompareDashboardPage from './full-pages/RxMyCompareDashboardPage';
import RxDropdownMenu from './Nav/RxDropdownMenu';
import RxMySavedHomesDashBoard from './full-pages/RxMySavedHomesDashBoard';
import RxIdPage from './full-pages/RxIdPage';
import RxMyHomeAlerts from './full-pages/RxMyHomeAlerts';

import { RxTextInput } from './RxTextInput';
import RxContactFormButton from './RxForms/RxContactFormButton';
import RxSessionDropdown from './Nav/RxSessionDropdown';

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
    replaceByCheerio($, '.agentface-wrapper', {
      content: `<img src="${agent_data.metatags.profile_image}" />`,
    });
    replaceByCheerio($, 'img.agentface', {
      photo: agent_data.metatags.profile_image,
    });
  }

  if (agent_data.metatags?.logo_for_light_bg) {
    $('.navbar-wrapper-2 a[href="/"] img').remove();
    $('.navbar-wrapper-2 .logo---phone-email a[data-type="email"]').text(agent_data.email);
    $('.navbar-wrapper-2 .logo---phone-email a[data-type="email"]').attr(
      'href',
      `mailto:${agent_data.email}?subject=${encodeURIComponent('[Leagent] Home Inquiry')}&body=${encodeURIComponent(
        `Hi ${agent_data.full_name.split(' ')[0]}!\n Found your Leagent website and I'm looking for a realtor for help.`,
      )}`,
    );
    $('.navbar-wrapper-2 .logo---phone-email a[data-type="phone"]').attr('href', `tel:${agent_data.phone}`);
    $('.navbar-wrapper-2 .logo---phone-email a[data-type="phone"]').text(agent_data.phone);
    $('.navbar-wrapper-2 > a[href="#"]').attr('href', '/');
    $('.navbar-wrapper-2 > a h3').remove();
    replaceByCheerio($, '.navbar-wrapper-2 > a', {
      content: `<img class="justify-self-start h-10" src="${agent_data.metatags.logo_for_light_bg}" />`,
    });
  }
}

export function fillPropertyGrid($: CheerioAPI, properties: MLSProperty[], wrapper_selector = '.similar-homes-grid', card_selector = '.property-card') {
  if (properties.length === 0) {
    $(wrapper_selector).remove();
    $('.similar-homes').remove();
  }
  properties.forEach((p: MLSProperty, i) => {
    replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1})`, {
      className: 'group static-card cursor-pointer',
    });
    replaceByCheerio($, `${wrapper_selector} .static-card:nth-child(${i + 1}) .propcard-details`, {
      prepend: `<a class="absolute bottom-0 left-0 h-3/4 w-full" href="/property?mls=${p.MLS_ID}"></a>`,
    });
    replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .heart-on-small-card`, {
      className: 'group-hover:block',
    });

    // Photo
    if (p.photos) {
      replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) > .propcard-image`, {
        backgroundImage: (p.photos as string[])[0],
      });
    }

    // Area
    replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .area-text`, {
      content: p.Area,
    });

    // Price
    replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .propcard-price`, {
      content: `${formatValues(p, 'AskingPrice')}`,
    });

    // Address
    replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .propcard-address`, {
      content: `${formatValues(p, 'Address')}`,
    });

    // Beds
    replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .bedroom-stat`, {
      content: `${formatValues(p, 'L_BedroomTotal') || '1'}`,
    });

    // Baths
    if (p.baths) {
      replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .bath-stat`, {
        content: `${formatValues(p, 'L_TotalBaths')}`,
      });
    } else {
      removeSection($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .bath-stat`, '.propertycard-feature');
    }

    // Sqft
    replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .sqft-stat`, {
      content: `${formatValues(p, 'L_FloorArea_GrantTotal')}` || `${formatValues(p, 'L_FloorArea_GrantTotal')}`,
    });

    // Year
    replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .year-stat`, {
      content: `${formatValues(p, 'L_YearBuilt')}`,
    });

    // Sold
    if (wrapper_selector.indexOf('sold') >= 0) {
      replaceByCheerio($, `${wrapper_selector} ${card_selector}:nth-child(${i + 1}) .sold-tag`, {
        className: 'inline-flex #{!important}',
      });
    }
  });
}

type ReplacementOptions = {
  backgroundImage?: string;
  content?: string;
  prepend?: string;
  className?: string;
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
    } else if (replacement.className) {
      $(target).attr('class', `${$(target).attr('class')} ${replacement.className}`);
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

export function appendJs(url: string, delay = 1200) {
  console.log('appendJs:', url);
  if (url.indexOf('website-files.com') >= 0) {
    console.log('timeout is set at', delay);
    return `
      var Webflow = Webflow || [];
      Webflow.push(() => {
        window.scrollTo({
          top: 1,
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      })
      setTimeout(() => {
        fetch('${url}').then((response) => {
          response.text().then(script_txt => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.text = script_txt.split('w-webflow-badge').join('oh-no-you-dont hidden').split('window.alert').join('console.log');
            document.body.appendChild(script)
          })
        })
      }, ${delay})
    `;
  }
  return `
  fetch('${url}').then((response) => {
    response.text().then(script_txt => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.text = script_txt;
      document.body.appendChild(script)
    })
  })
  `;
}
export function replaceFormsWithDiv($: CheerioAPI) {}

export function rexifyScriptsV2(html_code: string) {
  const options: HTMLReactParserOptions = {
    replace: node => {
      if (node.type === 'script') {
        const { attribs } = node as unknown as {
          attribs: Record<string, string>;
        };
        if (attribs.src) {
          if (attribs.src.indexOf('jquery') >= 0) {
            return <script src={attribs.src} type='text/javascript' crossOrigin='anonymous' integrity={attribs.integrity} />;
          } else {
            return (
              <>
                <script
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{
                    __html: appendJs(attribs.src, 0),
                  }}
                />
              </>
            );
          }
        }
      }
      return <></>;
    },
  };

  const elements = parse(html_code, options);
  return elements;
}

export function rexifyScripts(html_code: string) {
  const options: HTMLReactParserOptions = {
    replace: node => {
      if (node.type === 'script') {
        const { attribs } = node as unknown as {
          attribs: Record<string, string>;
        };
        if (attribs.src) {
          if (attribs.src.indexOf('jquery') >= 0) {
            return <script src={attribs.src} type='text/javascript' crossOrigin='anonymous' integrity={attribs.integrity} />;
          } else {
            return (
              <script
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                  __html: appendJs(attribs.src),
                }}
              />
            );
          }
        }
      }
      return <></>;
    },
  };

  const elements = parse(html_code, options);
  return elements;
}
/**
 *
 * @param html_code
 * @param agent_data
 * @returns
 */
export function rexify(html_code: string, agent_data: AgentData, property: Record<string, unknown> = {}, params: Record<string, unknown> = {}) {
  // Parse and replace
  let home_alert_index = 1;
  const options: HTMLReactParserOptions = {
    replace: node => {
      // Take out script / replace DOM placeholders with our Rexify
      if (node.type === 'script') {
        const { attribs } = node as unknown as {
          attribs: Record<string, string>;
        };

        if (attribs.src) {
          return <></>;
        } else {
          if ((node as Element).children) {
            // Scripts that are inline...

            const { data } = (node as Element).children[0] as {
              data: string;
            };

            if (data && data.indexOf('"Property Images"') > 0) {
              return <div data-carousel-photo='https://assets.website-files.com/642bc0505141b84f69254283/642bc0505141b84848254288_Prop%20Page%2001.jpg'></div>;
            }
            return <script dangerouslySetInnerHTML={{ __html: data }} type='application/json' />;
          }
        }
      } else if (node instanceof Element && node.attribs) {
        const { class: className, ...props } = attributesToProps(node.attribs);

        if (node.attribs.class && node.attribs.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.ID_PAGE)) {
          return (
            <RxIdPage {...props} agent={agent_data} className={node.attribs?.class || className}>
              {domToReact(node.children) as ReactElement[]}
            </RxIdPage>
          );
        }

        if (props.className && props.className.indexOf(WEBFLOW_NODE_SELECTOR.SESSION_DROPDOWN) >= 0) {
          return <RxSessionDropdown>{domToReact(node.children) as ReactElement}</RxSessionDropdown>;
        }

        // Property PDF Brochure rendering
        if (node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.PDF_PAGE) >= 0) {
          return (
            <RxPdfWrapper
              property={property as unknown as PropertyDataModel}
              agent={agent_data}
              nodeClassName={WEBFLOW_NODE_SELECTOR.PDF_PAGE}
              nodeProps={props}
              nodes={domToReact(node.children) as ReactElement[]}
            />
          );
        }

        // Property Detailed Page
        if (params?.slug === 'property' && node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.PROPERTY_PAGE) >= 0) {
          return (
            <RxDetailedListing
              property={property as unknown as PropertyDataModel}
              agent={agent_data}
              nodeClassName={WEBFLOW_NODE_SELECTOR.PROPERTY_PAGE}
              nodeProps={props}
              nodes={domToReact(node.children) as ReactElement[]}
            />
          );
        }

        if (node.attribs?.['data-wf-user-form-type'] === WEBFLOW_NODE_SELECTOR.SIGNUP) {
          return (
            <RxSignupPage
              {...props}
              agent={agent_data.id as number}
              logo={agent_data.metatags?.logo_for_light_bg}
              type={node.type}
              className={node.attribs?.class || className}
            >
              <>{domToReact(node.children) as ReactElement[]}</>
            </RxSignupPage>
          );
        }
        if (node.attribs?.['data-wf-user-form-type'] === WEBFLOW_NODE_SELECTOR.LOGIN) {
          return (
            <RxLoginPage {...props} className={`rexified ${className || ''} ${node.attribs?.class || ''}`.trim()}>
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
        if (node.attribs?.['data-wf-user-form-type'] === WEBFLOW_NODE_SELECTOR.UPDATE_PASSWORD) {
          return (
            <RxUpdatePasswordPage {...props} type={node.type}>
              <>{domToReact(node.children) as ReactElement[]}</>
            </RxUpdatePasswordPage>
          );
        }

        if (node.tagName === 'form' && (!className || className.indexOf('contact-form') === -1)) {
          return (
            <div {...props} id='rex-form' data-class={className}>
              {Children.map(domToReact(node.children) as ReactElement[], child => {
                if (child.type === 'input') {
                  if (child.props.className?.split(' ').includes('txt-agentid')) {
                    return <RxTextInput {...child.props} name='agent_id' rx-event={Events.SignUp} />;
                  }
                }
                return child;
              })}
            </div>
          );
        }

        if (node.attribs.class) {
          ///// HOME PAGE

          if (node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.CTA_CONTACT_FORM) >= 0) {
            return <RxContactFormButton className={node.attribs.class}>{domToReact(node.children) as ReactElement[]}</RxContactFormButton>;
          }

          if (node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.CONTACT_FORM) >= 0) {
            return (
              <RxContactForm agent={agent_data} nodeClassName={node.attribs.class} nodeProps={props} nodes={domToReact(node.children) as ReactElement[]} />
            );
          }

          if (node.attribs.class && node.attribs.class.indexOf(WEBFLOW_NODE_SELECTOR.FOOTER_SOCIAL_LINKS) >= 0) {
            return (
              <FooterSocialLinks agent={agent_data} nodeClassName={node.attribs.class} nodeProps={props} nodes={domToReact(node.children) as ReactElement[]} />
            );
          }

          ///// END OF HOME PAGE
          if (node.attribs.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.MY_ACCOUNT_WRAPPER)) {
            return (
              <RxMyAccountPage {...props} type={node.type} data={agent_data}>
                <>{domToReact(node.children) as ReactElement[]}</>
              </RxMyAccountPage>
            );
          }
          if (node.attribs?.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.CLIENTS_CARDS)) {
            return (
              <RxMyClients {...props}>
                <>{domToReact(node.children) as ReactElement[]}</>
              </RxMyClients>
            );
          }

          if (node.attribs.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.USER_MENU_DROPDOWN)) {
            return (
              <RxDropdownMenu {...props} className={className} agent-data={agent_data}>
                {domToReact(node.children) as ReactElement[]}
              </RxDropdownMenu>
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
          if (node.attribs.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.DOCUMENTS)) {
            return <DocumentsReplacer nodeProps={props} agent_data={agent_data} nodes={domToReact(node.children) as ReactElement[]} />;
          }
          if (node.attribs.class === WEBFLOW_NODE_SELECTOR.MY_SAVED_PROPERTIES_DASHBOARD) {
            return (
              <RxMySavedHomesDashBoard agent_data={agent_data} className={node.attribs.class}>
                {domToReact(node.children)}
              </RxMySavedHomesDashBoard>
            );
          }
          if (node.attribs.class === WEBFLOW_NODE_SELECTOR.MY_HOME_ALERTS) {
            return <RxMyHomeAlerts agent_data={agent_data} child={domToReact(node.children)} className={node.attribs.class} />;
          }
          if (node.attribs.class.split(' ').includes(WEBFLOW_NODE_SELECTOR.PROPERTY_CARD)) {
            return;
            // return <RxMyHomeAlerts agent_data={agent_data} child={domToReact(node.children)} className={node.attribs.class} />;
          }
          if (node.attribs.class === WEBFLOW_NODE_SELECTOR.MY_COMPARE_DASHBOARD) {
            return (
              <RxMyCompareDashboardPage agent-data={agent_data} className={node.attribs.class}>
                {domToReact(node.children)}
              </RxMyCompareDashboardPage>
            );
          }
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
      }
    },
  };

  const elements = parse(html_code, options);

  return elements;
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
    if (['{Address}', '{Agent Address}'].includes(placeholder)) {
      if (agent_data.street_1) {
        return (
          <>
            {domToReact(
              htmlToDOM(
                `<${tagName || 'span'}
            class="${className}"
          >
            ${agent_data.street_1}${agent_data.street_2 ? ', ' : ''}${agent_data.street_2 || ''}
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
          return (
            <div className={className}>
              <a href={`tel:${agent_data.phone}`}>{agent_data.phone}</a>
            </div>
          );
        default:
          return (
            <a className={className} href={`tel:${agent_data.phone}`}>
              {agent_data.phone}
            </a>
          );
      }
    } else if (placeholder === '{Agent Email}') {
      const { name: TagName } = element.parent as { name: string };
      switch (TagName) {
        case 'div':
          return (
            <div className={className}>
              <a
                href={`mailto:${agent_data.email}?subject=${encodeURIComponent('Would like to connect')}&body=${encodeURIComponent(
                  `Hi ${agent_data.full_name.split(' ')[0]}! Found your Leagent profile and would like to connect`,
                )}`}
              >
                {agent_data.email}
              </a>
            </div>
          );
        default:
          return (
            <a
              className={className}
              href={`mailto:${agent_data.email}?subject=${encodeURIComponent('Would like to connect')}&body=${encodeURIComponent(
                `Hi ${agent_data.full_name.split(' ')[0]}! Found your Leagent profile and would like to connect`,
              )}`}
            >
              {agent_data.email}
            </a>
          );
      }
    }
  }
  const property = record as MLSProperty & PropertyDataModel;
  switch (placeholder) {
    case '{Description}':
      return <p className={className}>{property.description}</p>;

    case '{Sqft}':
      return <p className={className}>{new Intl.NumberFormat(undefined).format(property.L_LotSize_SqMtrs)}</p>;

    case '{Baths}':
      return <p className={className}>{property.baths}</p>;

    case '{Beds}':
      return <p className={className}>{property.beds}</p>;

    case '{Year Built}':
      return <p className={className}>{property.year_built}</p>;

    case '{Area}':
      return <p className={className}>{property.area}</p>;

    case '{Address}':
      return <div className={className}>{property.title}</div>;

    case '{Lot Size}':
      return (
        <div className={className}>{(property.lot_sqft && formatValues(property, 'lot_sqft')) || property.lot_sqm || formatValues(property, 'lot_sqm')}</div>
      );

    case '{MLS Number}':
      return <span className={className}>{property.mls_id}</span>;

    case '{Land Title}':
      return <span className={className}>{property.land_title}</span>;

    case '{Price Per Sqft}':
      return <span className={className}>{formatValues(property, 'price_per_sqft')}</span>;

    case '{Price}':
      return <div className={className}>{property.asking_price}</div>;

    case '{Property Tax}':
      return (
        <span className={className}>
          {combineAndFormatValues(
            {
              gross_taxes: Number(property.gross_taxes),
              tax_year: Number(property.tax_year),
            },
            'gross_taxes',
            'tax_year',
          )}
        </span>
      );
  }
}
