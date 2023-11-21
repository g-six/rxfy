import { AgentData } from '@/_typings/agent';
import { Children, ReactElement, cloneElement } from 'react';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import { PropertyDataModel } from '@/_typings/property';
import NavIterator from '@/components/Nav/RxNavIterator';
import { objectToQueryString } from '@/_utilities/url-helper';
import HomePageSearchInput from './search-input.component';
import ActionButton from './homepage-action-button.module';
import { PropertyCard } from './property-card.component';
import { SOCIAL_MEDIA_FIELDS } from '@/_constants/agent-fields';
import RequestInfoPopup from '@/app/property/request-info-popup.module';
import HomePageSearchButton from './search-button.component';
import AgentListingsIterator from './listings-iterator.module';

export default function Iterator({
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
    else if (c.type === 'input' && c.props.type === 'submit') return <HomePageSearchButton {...c.props}>{c.props.value}</HomePageSearchButton>;
    else if (c.type === 'video') return c;
    else if (c.type !== 'a' && c.type !== 'svg' && c.props?.children && typeof c.props?.children !== 'string') {
      const { children: sub, ...props } = c.props;

      if (props['data-group'] === 'sold_listings')
        return cloneElement(
          c,
          {},
          <AgentListingsIterator agent={agent} listings={listings?.sold || []}>
            {sub}
          </AgentListingsIterator>,
        );
      if (props['data-group'] === 'active_listings')
        return cloneElement(
          c,
          {},
          <AgentListingsIterator agent={agent} listings={listings?.active || []}>
            {sub}
          </AgentListingsIterator>,
        );

      if (props['data-component'] === 'property_card' && listings?.active) {
        return (
          <>
            {listings.active.map(l => (
              <div {...props} key={l.mls_id}>
                <PropertyCard agent={agent} listing={l} data-type={props['data-type'] || 'default'}>
                  {sub}
                </PropertyCard>
              </div>
            ))}
          </>
        );
      }

      if (props['data-component'] === 'contact_form') {
        return (
          <RequestInfoPopup
            show={true}
            className={c.props.className}
            send_to={{
              email: agent.email,
              name: agent.full_name,
            }}
          >
            {c.props.children}
          </RequestInfoPopup>
        );
      }
      if (props['data-component'] === 'property_card' && listings?.sold) {
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
                          href: `${agent.domain_name ? '' : agent.metatags.profile_slug}/map?city=${l.title}&lat=${l.lat}&lng=${l.lng}`,
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
                    },11/720x720@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`})`,
                  }}
                />
              );
            }
          default:
            let rexified = (agent as unknown as { [key: string]: string })[c.props['data-field']];
            if (!rexified) {
              rexified = (agent.metatags as unknown as { [key: string]: string })[c.props['data-field']];
              if (SOCIAL_MEDIA_FIELDS.includes(c.props['data-field'])) {
                return rexified ? cloneElement(c, { href: rexified }) : <></>;
              }
              if (c.type === 'img')
                return rexified
                  ? cloneElement(c, {
                      src: c.props['data-field'].indexOf('logo_') === 0 ? getImageSized(rexified, 230) : rexified,
                    })
                  : c;
              else return c;
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
