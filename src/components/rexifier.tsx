import Script from 'next/script';
import parse, {
  HTMLReactParserOptions,
  Element,
  attributesToProps,
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
import { ReactElement } from 'react';
import {
  combineAndFormatValues,
  formatValues,
} from '@/_utilities/data-helpers/property-page';
import RxTable from './RxTable';

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

        if (property && Object.keys(property).length) {
          const record = property as unknown as MLSProperty;

          if (node.children && node.children.length === 1) {
            const { data } = node.children[0] as { data: string };

            /**
             * This is where the magic happens
             */
            const reX = rexifyOrSkip(
              data,
              record,
              node.attribs.class
            );
            if (reX) return reX;
          } else if (node.attribs && node.attribs.class) {
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
            // Building units section
            else if (
              node.lastChild &&
              (node.lastChild as HTMLNode).attribs.class &&
              (node.lastChild as HTMLNode).attribs.class.indexOf(
                'div-building-units-on-sale'
              ) >= 0 &&
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
              node.lastChild &&
              (node.lastChild as HTMLNode).attribs.class &&
              (node.lastChild as HTMLNode).attribs.class.indexOf(
                'div-sold-history'
              ) >= 0 &&
              node.attribs.class.indexOf(
                'building-and-sold-column'
              ) >= 0
            ) {
              return property.sold_history &&
                (property.sold_history as MLSProperty[]).length ? (
                <RxTable
                  rowClassName='div-sold-history'
                  rows={node.children}
                  data={property.sold_history as MLSProperty[]}
                />
              ) : (
                <></>
              );
            } else if (node.attribs.class.indexOf('financial') >= 0)
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
  placeholder: string,
  record: MLSProperty,
  className = ''
) {
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
