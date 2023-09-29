import { AgentData } from '@/_typings/agent';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import { gql_by_agent_uniq, gql_by_realtor_id } from '@/app/api/agents/graphql';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import FooterIterator from '@/components/RxFooter';
import RxNotifications from '@/components/RxNotifications';
import { RxLoginPage } from '@/components/full-pages/RxLoginPage';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { Metadata, ResolvingMetadata } from 'next';
import { Children, ReactElement, cloneElement } from 'react';

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

interface AgentQueryResult {
  data: {
    agents: {
      data: {
        id: number;
        attributes: {
          [k: string]: string;
        } & {
          agent_metatag: {
            data: {
              id: number;
              attributes: {
                [k: string]: string;
              } & {
                search_highlights?: {
                  labels: {
                    ne: {
                      lat: number;
                      lng: number;
                    };
                    sw: {
                      lat: number;
                      lng: number;
                    };
                    lat: number;
                    lng: number;
                    zoom: number;
                    name: string;
                    title: string;
                  }[];
                };
                geocoding?: {
                  lat: number;
                  lng: number;
                  city: string;
                  nelat: number;
                  nelng: number;
                  swlat: number;
                  swlng: number;
                };
              };
            };
          };
        };
      }[];
    };
  };
}

async function getData(slug: string) {
  const agent_graph = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: gql_by_agent_uniq,
      variables: {
        filters: {
          agent_id: {
            eqi: slug,
          },
        },
      },
    }),
  }).then(res => res.json());

  const {
    data: {
      agents: { data },
    },
  } = agent_graph as AgentQueryResult;
  if (data && data.length === 1) {
    const agent = {
      ...data[0].attributes,
      id: Number(data[0].id),
      metatags: data[0].attributes.agent_metatag?.data?.id
        ? {
            ...data[0].attributes.agent_metatag.data.attributes,
            id: Number(data[0].attributes.agent_metatag.data.id),
          }
        : undefined,
    };
    const { title, description, favicon, ogimage_url } = agent.metatags as unknown as {
      [k: string]: string;
    };

    return {
      page: {
        title,
        description,
        favicon,
        ogimage_url,
      },
      agent,
    };
  }

  return {
    page: {
      title: 'Leagent',
    },
  };
}
export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  // fetch data
  const {
    page: { title, description, favicon, ogimage_url },
  } = await getData(params.slug);

  if (title) {
    return {
      title,
      description,
      icons: favicon || undefined,
      openGraph: ogimage_url
        ? {
            images: [ogimage_url],
          }
        : undefined,
    };
  }

  return {
    title: 'Leagent',
  };
}

function Iterator({ agent, children }: { children: ReactElement; agent?: AgentData }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props?.children !== 'string') {
      // if (c.props.className?.includes('log-in-form')) {
      if (c.props.method) {
        return <RxLoginPage className={classNames(c.props.className || 'no-default-class', 'rexified')}>{c.props.children}</RxLoginPage>;
      }
      if (c.props?.className === 'f-footer-small' && agent) {
        return <FooterIterator agent={agent}>{c}</FooterIterator>;
      }
      return cloneElement(c, { className: classNames(c.props.className || 'no-default-class', 'rexified') }, <Iterator>{c.props.children}</Iterator>);
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default async function CustomerLogInPage(props: {
  params: {
    'profile-slug': string;
    slug: string;
  };
  searchParams: {
    [k: string]: string;
  };
}) {
  const { metatags, domain_name, webflow_domain, ...agent_data } = await findAgentRecordByAgentId(props.params.slug);
  let { data } = await axios.get(`https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/log-in.html`);

  // Replace webflow forms
  // data = data.split('<form').join('<section').split('</form>').join('</section>');

  // absolute urls
  data = data.split('href="/').join(`href="${domain_name ? '/' : ['', agent_data.agent_id, metatags.profile_slug, ''].join('/')}`);
  data = data.split('href="#').join(`href="${domain_name ? '/' : ['', agent_data.agent_id, metatags.profile_slug, ''].join('/')}`);

  const $: CheerioAPI = load(data);
  $('form').each((i, item) => {
    item.tagName = 'div';
  });
  let light_logo =
    metatags && metatags.logo_for_light_bg
      ? `<span style="background-image: url(${getImageSized(metatags.logo_for_light_bg, 240)})" class="bg-no-repeat bg-contain inline-block w-32 h-10" />`
      : `<span>${agent_data.full_name}</span>`;
  $('[data-field="logo_for_light_bg"]').replaceWith(light_logo);

  let dark_logo =
    metatags && metatags.logo_for_dark_bg
      ? `<span style="background-image: url(${getImageSized(metatags.logo_for_dark_bg, 240)})" class="bg-no-repeat bg-contain inline-block w-32 h-10" />`
      : `<span>${agent_data.full_name}</span>`;
  $('[data-field="logo_for_dark_bg"]').replaceWith(dark_logo);

  const logo_url = metatags.logo_for_light_bg || metatags.logo_for_dark_bg;
  let logo =
    metatags && logo_url
      ? `<span style="background-image: url(${getImageSized(logo_url, 240)})" class="bg-no-repeat bg-contain inline-block w-32 h-10" />`
      : agent_data.full_name;
  $('[data-field="logo"]').html(logo);

  // $('[data-field="phone"]').text(agent_data.phone);
  // $('[data-field="phone"]').each((i, e) => {
  //   e.attribs['href'] = `tel:${agent_data.phone}`;
  // });
  // $('[data-field="email"]').text(agent_data.email);
  // $('[data-field="email"]').each((i, e) => {
  //   e.attribs['href'] = `mailto:${agent_data.email}`;
  // });

  const body = $('body > div,section,footer');
  return (
    <>
      <Iterator
        agent={{
          ...agent_data,
          metatags,
        }}
      >
        {domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}
      </Iterator>
      <RxNotifications />
    </>
  );
}
