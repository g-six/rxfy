/* eslint-disable @next/next/no-img-element */
import Script from 'next/script';
import parse, {
  HTMLReactParserOptions,
  Element,
  attributesToProps,
  DOMNode,
  domToReact,
} from 'html-react-parser';
import EmailAnchor from './A/Email';
import { AgentData } from '@/_typings/agent';
import PersonalTitle from './PersonalTitle';
import PersonalBioParagraph from './PersonalBioParagraph';
import PropertyCarousel from './PropertyCarousel/main';
import { RexifyStatBlock } from './PropertyInformationRow';
import { MLSProperty } from '@/_typings/property';
import { RexifyPropertyFeatureBlock } from './PropertyFeatureSection';
import { HTMLNode } from '@/_typings/elements';
import {
  combineAndFormatValues,
  formatValues,
  getSimilarHomes,
} from '@/_utilities/data-helpers/property-page';
import RxTable from './RxTable';
import SimilarHomes from './SimilarHomes';
import { ReactElement } from 'react';
import { Cheerio, CheerioAPI } from 'cheerio';
import PropertyCard from './PropertyCard';

function findInfoIfFound(agent_data: AgentData, info: string) {
  if (!agent_data) return '';
  switch (info) {
    case 'business_name':
      return agent_data.full_name;
    case 'business_logo':
      return (
        agent_data.metatags && agent_data.metatags.logo_for_dark_bg
      );
    default:
      return '';
  }
}

export function fillAgentInfo(
  $: CheerioAPI,
  agent_data: AgentData
) {
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
}

export function fillPropertyGrid(
  $: CheerioAPI,
  properties: MLSProperty[],
  selector = '.similar-homes-grid'
) {
  properties.forEach((p: MLSProperty, i) => {
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${i + 1})`,
      {
        ['data-mls']: p.MLS_ID,
      }
    );

    // Photo
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${
        i + 1
      }) > .propcard-image`,
      {
        backgroundImage: (p.photos as string[])[0],
      }
    );

    // Area
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${
        i + 1
      }) .area-text`,
      {
        content: p.Area,
      }
    );

    // Price
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${
        i + 1
      }) .propcard-price`,
      {
        content: `${formatValues(p, 'AskingPrice')}`,
      }
    );

    // Address
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${
        i + 1
      }) .propcard-address`,
      {
        content: `${formatValues(p, 'Address')}`,
      }
    );

    // Beds
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${
        i + 1
      }) .bedroom-stat`,
      {
        content: `${formatValues(p, 'L_BedroomTotal')}`,
      }
    );

    // Baths
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${
        i + 1
      }) .bath-stat`,
      {
        content: `${formatValues(p, 'L_TotalBaths')}`,
      }
    );

    // Sqft
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${
        i + 1
      }) .sqft-stat`,
      {
        content: `${formatValues(p, 'L_FloorArea_Total')}`,
      }
    );

    // Year
    replaceByCheerio(
      $,
      `${selector} > .property-card-map:nth-child(${
        i + 1
      }) .year-stat`,
      {
        content: `${formatValues(p, 'L_YearBuilt')}`,
      }
    );
  });
}

export function replaceByCheerio(
  $: CheerioAPI,
  target: string,
  replacement: Record<string, string>
) {
  if (replacement) {
    if (target.indexOf('.propcard-image') >= 0) {
      const styles: string[] = [];
      if (replacement.backgroundImage) {
        styles.push(
          `background-image: url(${replacement.backgroundImage})`
        );
      }

      if (styles.length > 0) {
        $(target).attr('style', styles.join('; '));
      }
    } else if (replacement.backgroundImage) {
      $(target).attr(
        'style',
        `background-image: url(${replacement.backgroundImage})`
      );
    } else if (replacement.photo) {
      $(target).attr('src', replacement.photo);
      $(target).removeAttr('srcset');
    } else if (replacement.content) {
      $(target).html(replacement.content);
    } else if (replacement['data-mls']) {
      $(target).attr('data-mls', replacement['data-mls']);
    }
  }
}

/**
 *
 * @param html_code
 * @param agent_data
 * @returns
 */
export function rexify(
  html_code: string,
  agent_data: AgentData,
  property: Record<string, unknown> = {}
) {
  // Cheerio

  // React parser
  const options: HTMLReactParserOptions = {
    replace: (node) => {
      // Take out script / replace DOM placeholders with our Reidget
      if (node instanceof Element && node.attribs) {
        const { class: className, ...props } = attributesToProps(
          node.attribs
        );

        if (
          node.attribs['data-type'] === 'email' &&
          node.tagName === 'a'
        ) {
          // Emai link
          return <EmailAnchor {...props} agent={agent_data} />;
        }

        if (node.attribs['data-type'] === 'personal_title') {
          // Personal title on top of the home page (hero)
          return <PersonalTitle {...props} agent={agent_data} />;
        }

        if (node.attribs['data-type'] === 'personal_bio') {
          // Personal bio <p>
          return (
            <PersonalBioParagraph {...props} agent={agent_data} />
          );
        }

        if (node.attribs['data-type'] === 'personal_bio') {
          // Personal bio <p>
          return (
            <PersonalBioParagraph {...props} agent={agent_data} />
          );
        }

        if (
          node.attribs['data-type'] === 'neighbourhood-link' &&
          agent_data
        ) {
          node.parentNode?.childNodes.map((child, seq: number) => {
            console.log('neighbourhood-link', seq);
          });
        }

        if (
          node.attribs.class &&
          node.attribs.class.indexOf('li-property') >= 0
        ) {
          return <PropertyCarousel {...props} agent={agent_data} />;
        }

        if (node.children && node.children.length === 1) {
          /**
           * This is where the magic happens
           */
          const reX = rexifyOrSkip(
            node.children[0],
            {
              ...(property && Object.keys(property).length
                ? property
                : {}),
              agent_data,
            },
            node.attribs.class,
            node.name
          );
          if (reX) return reX;
        }

        if (property && Object.keys(property).length) {
          const record = property as unknown as MLSProperty;
          if (node.attribs['data-mls']) {
            return (
              <PropertyCard
                className={node.attribs.class || ''}
                data={{
                  mls: node.attribs['data-mls'],
                }}
              >
                {domToReact(node.children) as ReactElement[]}
              </PropertyCard>
            );
          }
          if (node.attribs && node.attribs.class) {
            // Grouped data table sections
            // Property Information, Financial, Dimensions, Construction
            if (node.attribs.class.indexOf('propinfo') >= 0)
              return (
                <RexifyStatBlock
                  node={node}
                  record={record}
                  groupName='propinfo'
                />
              );
            else if (node.attribs.class.indexOf('financial') >= 0)
              return (
                <RexifyStatBlock
                  node={node}
                  record={record}
                  groupName='financial'
                />
              );
            else if (node.attribs.class.indexOf('dimensions') >= 0)
              return (
                <RexifyStatBlock
                  node={node}
                  record={record}
                  groupName='dimensions'
                />
              );
            else if (
              node.attribs.class.indexOf('construction') >= 0
            )
              return (
                <RexifyStatBlock
                  node={node}
                  record={record}
                  groupName='construction'
                />
              );
            else if (
              node.attribs.class.indexOf('div-features-block') >= 0
            ) {
              return (
                <RexifyPropertyFeatureBlock
                  node={node}
                  record={record}
                />
              );
            }
            // Building units section
            else if (
              node.lastChild &&
              (node.lastChild as HTMLNode).attribs &&
              (node.lastChild as HTMLNode).attribs.class
            ) {
              const child_class = (node.lastChild as HTMLNode)
                .attribs.class;
              if (
                child_class.indexOf('div-building-units-on-sale') >=
                  0 &&
                node.attribs.class.indexOf(
                  'building-and-sold-column'
                ) >= 0
              ) {
                return property.neighbours &&
                  (property.neighbours as MLSProperty[]).length ? (
                  property.AddressUnit ? (
                    <RxTable
                      rows={node.children}
                      data={property.neighbours as MLSProperty[]}
                      rowClassName='div-building-units-on-sale'
                    />
                  ) : (
                    <></>
                  )
                ) : (
                  <></>
                );
              } // Sold history
              else if (
                child_class.indexOf('div-sold-history') >= 0 &&
                node.attribs.class.indexOf(
                  'building-and-sold-column'
                ) >= 0
              ) {
                return property.sold_history &&
                  (property.sold_history as MLSProperty[])
                    .length ? (
                  <RxTable
                    rowClassName='div-sold-history'
                    rows={node.children}
                    data={property.sold_history as MLSProperty[]}
                  />
                ) : (
                  <></>
                );
              }
            }
          }
        }

        if (node.type === 'script' && node.attribs.src) {
          const { pathname } = new URL(node.attribs.src);

          return (
            <>
              <Script
                id={pathname}
                dangerouslySetInnerHTML={{
                  __html: `
                    var script = document.createElement('script');
                    ${
                      pathname.indexOf('jquery') >= 0
                        ? 'script.defer = true;'
                        : 'script.async = true;'
                    }
                    script.src = '${node.attribs.src}';
                    script.onload = () => {
                        console.log('${
                          node.attribs.src
                        }', '${pathname.split('/').pop()} loaded')

                        setTimeout(() => {
                            const badge = document.querySelector('.w-webflow-badge')
                            if (badge) {
                                badge.remove();
                                console.log('badge found and removed');
                            }
                        }, 1000)
                    }
                    
                    ${
                      node.attribs.src.indexOf('jquery')
                        ? 'document.body.appendChild(script);'
                        : ''
                    }
                  `,
                }}
              />
            </>
          );
        }
      }
    },
  };

  const elements = parse(html_code, options);

  return elements;
}

function rexifyOrSkip(
  element: DOMNode,
  record: MLSProperty | { agent_data?: AgentData },
  className = '',
  tagName = ''
) {
  const { agent_data } = record as { agent_data: AgentData };
  const { data: placeholder } = element as { data: string };
  if (agent_data) {
    if (placeholder === '{Agent Title}') {
    }
    if (
      placeholder === '{Bio Title}' ||
      placeholder === '{Agent Title}'
    ) {
      if (agent_data.metatags?.personal_title) {
        switch (tagName) {
          case 'h1':
            return (
              <h1 className={className}>
                {agent_data.metatags?.personal_title}
              </h1>
            );
          default:
            return (
              <span className={className}>
                {agent_data.metatags?.personal_title}
              </span>
            );
        }
      }
    }
    if (placeholder === '{Bio}') {
      if (agent_data.metatags?.personal_bio) {
        return (
          <p
            className={className}
            style={{ whiteSpace: 'pre-line' }}
          >
            {agent_data.metatags?.personal_bio
              .split('\n')
              .map((text, i) => {
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
      if (
        className.indexOf('logo-dark') >= 0 &&
        agent_data.metatags?.logo_for_light_bg
      ) {
        return (
          <h3
            className={className}
            style={{
              backgroundImage: `url(${agent_data.metatags?.logo_for_light_bg})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              flex: 1,
              /* We wanna hide the agent name text if logo is available */
              textIndent: '-100em',
            }}
          >
            &nbsp;{agent_data.full_name || '{Agent Name}'}
          </h3>
        );
      }

      switch (tagName) {
        case 'h1':
          return (
            <h1 className={className}>{agent_data.full_name}</h1>
          );
        case 'h2':
          return (
            <h2 className={className}>{agent_data.full_name}</h2>
          );
        case 'h3':
          return (
            <h3 className={className}>{agent_data.full_name}</h3>
          );
        case 'h4':
          return (
            <h4 className={className}>{agent_data.full_name}</h4>
          );
        case 'h5':
          return (
            <h5 className={className}>{agent_data.full_name}</h5>
          );
        default:
          return (
            <span className={className}>
              {agent_data.full_name}
            </span>
          );
      }
    } else if (className.indexOf('phone-link-blockj') >= 0) {
      return (
        <a
          href={`tel:${agent_data.phone.replace(/[^0-9.]/g, '')}`}
          className={className}
        >
          {agent_data.phone}
        </a>
      );
    } else if (placeholder === '{Agent Phone Number}') {
      const { name: TagName } = element.parent as { name: string };
      switch (TagName) {
        case 'div':
          return (
            <div className={className}>{agent_data.phone}</div>
          );
        default:
          return (
            <span className={className}>{agent_data.phone}</span>
          );
      }
    } else if (placeholder === '{Agent Email}') {
      const { name: TagName } = element.parent as { name: string };
      switch (TagName) {
        case 'div':
          return (
            <div className={className}>{agent_data.email}</div>
          );
        default:
          return (
            <span className={className}>{agent_data.email}</span>
          );
      }
    }
  }
  switch (placeholder) {
    case '{Description}':
      return <p className={className}>{record.L_PublicRemakrs}</p>;

    case '{Sqft}':
      return (
        <p className={className}>
          {new Intl.NumberFormat(undefined).format(
            record.L_LotSize_SqMtrs
          )}
        </p>
      );

    case '{Baths}':
      return <p className={className}>{record.L_TotalBaths}</p>;

    case '{Beds}':
      return <p className={className}>{record.L_BedroomTotal}</p>;

    case '{Year Built}':
      return <p className={className}>{record.L_YearBuilt}</p>;

    case '{Area}':
      return <p className={className}>{record.Area}</p>;

    case '{Address}':
      return <div className={className}>{record.Address}</div>;

    case '{Building Type}':
      return <div className={className}>{record.PropertyType}</div>;

    case '{Lot Size}':
      return (
        <div className={className}>
          {formatValues(record, 'L_LotSize_SqMtrs')}
        </div>
      );

    case '{MLS Number}':
      return <span className={className}>{record.MLS_ID}</span>;

    case '{Land Title}':
      return <span className={className}>{record.LandTitle}</span>;

    case '{Price Per Sqft}':
      return (
        <span className={className}>
          {formatValues(record, 'PricePerSQFT')}
        </span>
      );

    case '{Price}':
      return (
        <div className={className}>
          {formatValues(record, 'AskingPrice')}
        </div>
      );

    case '{Property Tax}':
      return (
        <span className={className}>
          {combineAndFormatValues({
            L_GrossTaxes: record.L_GrossTaxes,
            ForTaxYear: record.ForTaxYear,
          })}
        </span>
      );
  }
}
