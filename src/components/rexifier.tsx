import Script from 'next/script';
import parse, {
  HTMLReactParserOptions,
  Element,
  attributesToProps,
  domToReact,
} from 'html-react-parser';
import NavLogo from './Nav/Logo';
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
import { formatValues } from '@/_utilities/data-helpers/property-page';

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
  if (property && Object.keys(property).length) {
    // console.log(
    //   'rexify property page',
    //   JSON.stringify(property, null, 4)
    // );
  } else {
    // console.log('rexify agent_data', agent_data);
  }
  const options: HTMLReactParserOptions = {
    replace: (node) => {
      // Take out script / replace DOM placeholders with our Reidget
      if (node instanceof Element && node.attribs) {
        const { class: className, ...props } = attributesToProps(
          node.attribs
        );
        if (
          node.attribs.id === 'reidget-nav-logo' ||
          node.attribs['data-type'] === 'business_logo'
        ) {
          // Logo Reidget
          return <NavLogo {...props} agent={agent_data} />;
        }

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
            if (data === '{Description}') {
              return (
                <p className={node.attribs.class}>
                  {record.L_PublicRemakrs}
                </p>
              );
            }
            if (data === '{Sqft}') {
              return (
                <p className={node.attribs.class}>
                  {new Intl.NumberFormat(undefined).format(
                    record.L_LotSize_SqMtrs
                  )}
                </p>
              );
            }
            if (data === '{Baths}') {
              return (
                <p className={node.attribs.class}>
                  {record.L_TotalBaths}
                </p>
              );
            }
            if (data === '{Beds}') {
              return (
                <p className={node.attribs.class}>
                  {record.L_BedroomTotal}
                </p>
              );
            }
            if (data === '{Year Built}') {
              return (
                <p className={node.attribs.class}>
                  {record.L_YearBuilt}
                </p>
              );
            }
            if (data === '{Area}') {
              return (
                <p className={node.attribs.class}>{record.Area}</p>
              );
            }

            if (data === '{Price}') {
              return (
                <div className={node.attribs.class}>
                  $
                  {new Intl.NumberFormat(undefined).format(
                    record.AskingPrice
                  )}
                </div>
              );
            }
            if (data === '{Address}') {
              return (
                <div className={node.attribs.class}>
                  {record.Address}
                </div>
              );
            }
            if (data === '{Building Type}') {
              return (
                <p className={node.attribs.class}>
                  {record.PropertyType}
                </p>
              );
            }
            // ----------------------------------------------------
            // Section with icons
            if (data === '{MLS Number}' && record.MLS_ID) {
              return (
                <span className={node.attribs.class}>
                  {record.MLS_ID}
                </span>
              );
            }

            if (data === '{Lot Size}' && record.L_LotSize_SqMtrs) {
              return (
                <p className={node.attribs.class}>
                  {new Intl.NumberFormat(undefined).format(
                    record.L_LotSize_SqMtrs
                  )}
                </p>
              );
            }

            if (data === '{Land Title}') {
              return (
                <p className={node.attribs.class}>
                  {record.LandTitle}
                </p>
              );
            }

            if (data === '{Price Per Sqft}') {
              if (record.PricePerSQFT)
                return (
                  <p className={node.attribs.class}>
                    $
                    {new Intl.NumberFormat(undefined).format(
                      record.PricePerSQFT
                    )}
                  </p>
                );
              else {
                return <></>;
              }
            }

            if (data === '{Property Tax}') {
              if (record.L_GrossTaxes && record.ForTaxYear)
                return (
                  <p className={node.attribs.class}>
                    $
                    {new Intl.NumberFormat(undefined).format(
                      record.L_GrossTaxes
                    )}{' '}
                    ({record.ForTaxYear})
                  </p>
                );
              else {
                return <></>;
              }
            }
            // end of section with icons
            // ----------------------------------------------------
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
              const elements = domToReact(
                node.children
              ) as unknown as ReactElement[];

              const contents = elements.filter(
                (el) =>
                  el.props.className !==
                  'div-building-units-on-sale'
              );

              const children = elements.filter(
                (el) =>
                  el.props.className ===
                  'div-building-units-on-sale'
              );

              const neighbours =
                property.neighbours as MLSProperty[];

              return neighbours && neighbours.length ? (
                <div className='building-and-sold-column'>
                  {contents}

                  {neighbours
                    .filter(({ Status }) => Status === 'Active')
                    .map((neighbour) => {
                      formatValues(
                        neighbour.AskingPrice,
                        'AskingPrice'
                      );
                      return (
                        <div
                          key={neighbour.MLS_ID}
                          className={children[0].props.className}
                        >
                          {children[0].props.children.map(
                            (unit: ReactElement) => {
                              if (
                                unit.props.children ===
                                '{Other Unit No}'
                              ) {
                                return (
                                  <a
                                    href={`/property?mls=${neighbour.MLS_ID}`}
                                    key={unit.key}
                                    className={unit.props.className}
                                  >
                                    Unit {neighbour.AddressUnit}{' '}
                                  </a>
                                );
                              }
                              if (
                                unit.props.children ===
                                '{Other Beds}'
                              ) {
                                return (
                                  <span
                                    key={unit.key}
                                    className={unit.props.className}
                                  >
                                    {neighbour.L_BedroomTotal}
                                  </span>
                                );
                              }
                              if (
                                unit.props.children ===
                                '{Other Sqft}'
                              ) {
                                return (
                                  <span
                                    key={unit.key}
                                    className={unit.props.className}
                                  >
                                    {formatValues(
                                      neighbour.L_FloorArea_Total,
                                      'L_FloorArea_Total'
                                    )}
                                  </span>
                                );
                              } else {
                                return (
                                  <span
                                    key={unit.key}
                                    className={unit.props.className}
                                  >
                                    {formatValues(
                                      neighbour.AskingPrice,
                                      'AskingPrice'
                                    )}
                                  </span>
                                );
                              }
                            }
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : null;
              return (
                <div>
                  <div className={header.attribs.class}>{}</div>
                  <div
                    className={`${row.attribs.class} rexified`}
                  ></div>
                </div>
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
