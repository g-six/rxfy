import './globals.scss';
import parse, { DOMNode, domToReact } from 'html-react-parser';
import { CheerioAPI, load } from 'cheerio';
import { notFound, redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { Inter } from 'next/font/google';

import { WEBFLOW_NODE_SELECTOR, WebFlow } from '@/_typings/webflow';
import { AgentData, AgentMetatags } from '@/_typings/agent';
import { getPropertyData } from '@/_utilities/data-helpers/property-page';
import { fillAgentInfo, fillPropertyGrid, removeSection, replaceByCheerio, rexify } from '@/components/rexifier';
import RxNotifications from '@/components/RxNotifications';
import MyProfilePage from '@/rexify/my-profile';
import styles from './page.module.scss';
import { getUserDataFromSessionKey } from './api/update-session';
import { findAgentRecordByAgentId } from './api/agents/model';
import NotFound from './not-found';
import { buildCacheFiles, getPropertiesFromAgentInventory } from './api/properties/model';
import { getPrivateListing } from './api/private-listings/model';
import { getUserSessionData } from './api/check-session/model';
import PageComponent from './[slug]/page.module';
import { getAgentBy } from './api/_helpers/agent-helper';
import { LEAGENT_WEBFLOW_DOMAINS } from '@/_constants/webflow-domains';
import CustomerLogInPage from './[slug]/log-in/page';
import ClientMyProfile from './[slug]/my-profile/page';
import MyDocuments from './[slug]/my-documents/page';
import ClientDashboard from './[slug]/client-dashboard/page';
import MyAllProperties from './[slug]/my-all-properties/page';
import MyHomeAlerts from './[slug]/my-home-alerts/page';
import { consoler } from '@/_helpers/consoler';
import { getThemeDomainHostname, getWebflowDomain } from '@/_helpers/themes';
import AiPrompt from '@/rexify/realtors/ai';
import { ReactElement } from 'react';

const FILE = 'app/page.tsx';
const inter = Inter({ subsets: ['latin'] });

function loadAiResults($: CheerioAPI, user_id: string, slug?: string, origin?: string) {
  ['oslo', 'hamburg', 'malta'].forEach(theme => {
    $(`.theme-area.home-${theme}`).replaceWith(
      `<iframe data-src="https://leagent.com?paragon=${user_id}&theme=${theme}" className="${styles.homePagePreview} theme-area home-${theme}" />`,
    );
  });

  $(`[data-w-tab="Tab 2"] .f-section-large-11`).html(
    `<iframe src="https://leagent.com/${user_id}/${slug}/property?theme=default&mls=R2782417" className="${styles.homePagePreview}" />`,
  );
  // PDF
  $(`.theme-area.pdf-brochure-preview`).replaceWith(
    `<iframe data-src="https://leagent.com/api/pdf/mls/R2517461?agent=${user_id}&slug=${slug}" className="theme-area pdf-brochure-preview" />`,
  );
  replaceByCheerio($, '[data-w-tab="Tab 7"].w-tab-pane', {
    className: 'w-full h-full',
  });
  $(`[data-w-tab="Tab 7"].w-tab-pane`).html(
    `<iframe src="https://leagent.com/${user_id}/${slug}/map?nelat=49.34023817805203&nelng=-122.79116520440928&swlat=49.111312957626524&swlng=-123.30807516134138&lat=49.22590814575915&lng=-123.0496201828758&city=Vancouver&zoom=11" className="${styles.homePagePreview}" />`,
  );

  $('.building-and-sold-info').remove();
  $('[class^="similar-homes"]').remove();
  replaceByCheerio($, '[data-w-tab="Tab 2"] .f-section-large-11', {
    className: [WEBFLOW_NODE_SELECTOR.AI_THEME_PANE_2, styles.homePagePreview].join(' '),
  });
  replaceByCheerio($, '[data-w-tab="Tab 2"] .section---top-images', {
    className: styles.propertyTopPhotoGrid,
  });
}

const LEAGENT_DOMAINS = ['leagent.com', 'dev.leagent.com', 'beta.leagent.com'];

export default async function Home({ params, searchParams }: { params: { [k: string]: string }; searchParams: { [k: string]: string } }) {
  const start = Date.now();
  const url = headers().get('x-url') as string;

  const { hostname, origin, pathname } = new URL(url);
  let webflow_domain = getWebflowDomain(headers().get('host') || '') || '';

  let possible_agent = '';
  let profile_slug = '';

  let agent_data: AgentData = {} as unknown as AgentData;
  const domain_name = `${headers().get('host')}`.split(':').reverse().pop();

  if (headers().get('x-agent-id')) possible_agent = headers().get('x-agent-id') as string;
  if (headers().get('x-profile-slug')) profile_slug = headers().get('x-profile-slug') as string;

  const filename = `${headers().get('x-url')}`.split('/').pop();

  if (filename !== 'index.html' && webflow_domain === 'leagent-website.webflow.io') {
    // Other pages
    const page_req = await fetch(url);
    const page_html = await page_req.text();
    const $: CheerioAPI = load(page_html);

    switch (filename) {
      case 'ai.html':
        return <AiPrompt>{domToReact($('body > div') as unknown as DOMNode[]) as ReactElement}</AiPrompt>;
    }
  } else if (possible_agent) {
    const client_dashboard_params = {
      slug: possible_agent,
    };
    consoler(FILE, { possible_agent, client_dashboard_params, params });
    switch (params.slug) {
      case 'log-in':
        return CustomerLogInPage({
          params: client_dashboard_params,
          searchParams,
        });

      case 'my-profile':
        return ClientMyProfile({
          params: client_dashboard_params,
          searchParams,
        });
      case 'my-documents':
        return MyDocuments({
          params: client_dashboard_params,
        });
    }
  } else if (domain_name && !LEAGENT_DOMAINS.includes(domain_name)) {
    agent_data = await getAgentBy({
      domain_name,
    });

    if (agent_data?.agent_id && pathname.split('/').pop() === 'index.html') {
      consoler(FILE, 'Returning PageComponent');
      return <PageComponent agent_id={agent_data.agent_id} />;
    }
  }

  const { TEST_WF_DOMAIN } = process.env as unknown as { [key: string]: string };
  const axios = (await import('axios')).default;

  let data, listings, property;
  let session_key = cookies().get('session_key')?.value || '';
  let session_as = cookies().get('session_as')?.value || 'customer';

  if (headers().get('x-url')) {
    switch (filename) {
      case 'index.html':
        if (headers().get('x-agent-id') && headers().get('x-profile-slug')) {
          consoler(FILE, 'Returning PageComponent');
          return <PageComponent agent_id={headers().get('x-agent-id') as string} />;
        }
        break;
    }
  }

  if (possible_agent && profile_slug) {
    // Check if the slug matches a realtor
    if (profile_slug === 'leagent' || profile_slug.indexOf('la-') === 0) {
      const agent_record = await findAgentRecordByAgentId(possible_agent);
      const { metatags } = agent_record;

      if (agent_record) {
        agent_data = {
          ...agent_record,
        };

        if (!agent_data || !metatags.profile_slug || metatags.profile_slug !== profile_slug) {
          consoler(FILE, 'Agent record not found for agent_id', possible_agent);
          return <NotFound id='page-1' className='profile-not-found'></NotFound>;
        }
      } else {
        consoler(FILE, 'AgentMetatag record not found for agent_id', possible_agent);
        return <NotFound id='page-2' className='invalid-profile-slug'></NotFound>;
      }
    }
  } else if (session_key) {
    if (session_as === 'realtor') {
      const [session_hash, user_id] = session_key.split('-');
      const session = await getUserDataFromSessionKey(session_hash, Number(user_id), 'realtor');
      if (Object.keys(session).length === 0) {
        redirect('/log-out');
        return;
      }
      const { agent: session_agent } = session as unknown as {
        agent: AgentData & {
          agent_metatag: AgentMetatags;
        };
      };

      agent_data = {
        ...session_agent,
        metatags: session_agent.agent_metatag,
      };
    }
  }

  try {
    const req_page_html = await axios.get(headers().get('x-url') as string);
    data = req_page_html.data;
  } catch (e) {
    consoler(FILE, 'Unable to fetch page html for', headers().get('x-url'));
  }

  if (typeof data !== 'string') {
    data = '<html><head><meta name="title" content="Not found" /></head><body>Not found</body></html>';
    notFound();
  }

  const header_list = headers();
  const $: CheerioAPI = load(
    `${data}`.split('</title>').join(`</title>
    <link rel='canonical' href='${header_list.get('referer') || header_list.get('x-canonical')}' />`),
  );

  if (params.slug) {
    replaceByCheerio($, 'a.logo-div', {
      href: `/${params.slug}`,
    });
  }

  $('form').removeAttr('id');
  $('form').removeAttr('name');
  if (process.env.NEXT_PUBLIC_BUY_BUTTON)
    replaceByCheerio($, '.btn-stripe-buy', {
      href: process.env.NEXT_PUBLIC_BUY_BUTTON,
    });

  // Special cases
  if (searchParams.paragon) {
    agent_data = await findAgentRecordByAgentId(searchParams.paragon);

    if (agent_data) {
      if (searchParams.theme === 'default') webflow_domain = `${process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN}`;
      agent_data.webflow_domain = webflow_domain || '';
      loadAiResults($, agent_data.agent_id, agent_data.metatags.profile_slug, origin);
    }
  } else if (!(searchParams.theme && searchParams.agent) && webflow_domain === process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN) {
    if (!session_key && params.slug && ['ai-result'].includes(params.slug as string)) {
      data = '<html><head><meta name="title" content="Not found" /></head><body>Not found</body></html>';
      notFound();
    }
    if (session_key && params.slug !== 'ai') {
      const [session_hash, user_id] = session_key.split('-');

      if (session_hash && user_id && webflow_domain !== process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN) {
        try {
          const session = await getUserDataFromSessionKey(session_hash, Number(user_id), 'realtor');
          const { agent: session_agent } = session as unknown as {
            agent?: AgentData & {
              agent_metatag?: AgentMetatags;
              featured_listings: string[];
            };
          };

          if (session_agent) {
            agent_data = session_agent;
            if (session_agent.featured_listings?.length) {
              try {
                await axios.get(`https://leagent.com/api/properties/mls-id/${session_agent.featured_listings[0]}`);
                const feature_listing = await axios.get(`${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${session_agent.featured_listings[0]}/recent.json`);
                property = feature_listing.data;
                property.listing_by = `Listing courtesy of ${session_agent.full_name}`;
              } catch (e) {
                consoler(FILE, 'Featured listing not found');
              }
            }
            if (agent_data) {
              agent_data.metatags = session_agent.agent_metatag;
              loadAiResults($, session_agent.agent_id, agent_data.metatags.profile_slug, origin);
            }
          }
        } catch (e) {
          consoler(FILE, 'Invalid session key');
        }
      }
    }
  } else if (session_key) {
    switch (params.slug) {
      case 'my-profile':
        return (
          <>
            <MyProfilePage
              data={{ session_key, 'user-type': webflow_domain === (process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN as string) ? 'realtor' : 'customer' }}
            >
              {parse($.html()) as unknown as JSX.Element}
            </MyProfilePage>

            <RxNotifications />
          </>
        );
      default:
        break;
    }
  }

  $('a[data-video-url]').each((num, el) => {
    $(el).replaceWith(`<div data-video-url="${$('a[data-video-url]').attr('data-video-url')}">${$('a[data-video-url]').html()}</div>`);
  });

  replaceByCheerio($, 'html', {
    removeProps: 'class',
  });
  replaceByCheerio($, '.tab-pane-private-listings.w--active', {
    removeClassName: 'w--active',
  });
  replaceByCheerio($, '.w-nav', {
    removeClassName: 'w-nav',
  });
  replaceByCheerio($, '.tab-pane-private-listings.w--tab-active', {
    removeClassName: 'w--tab-active',
  });
  replaceByCheerio($, '.modal-base.existing', {
    className: 'hidden-block',
  });

  replaceByCheerio($, '.w-nav-menu .nav-dropdown-2', {
    className: 'nav-menu-list-wrapper',
  });

  replaceByCheerio($, '.w-nav-menu .nav-dropdown-2 .w-dropdown-toggle', {
    className: 'nav-menu-list-toggle',
  });
  replaceByCheerio($, '.bedbathandbeyond > .w-dropdown-toggle', {
    className: 'filter-group-modal-toggle',
  });

  replaceByCheerio($, '.w-nav-menu .nav-dropdown-2 .w-dropdown-list', {
    className: 'nav-menu-list',
  });
  replaceByCheerio($, '.bedbathandbeyond > nav', {
    className: 'filter-group-modal',
  });
  replaceByCheerio($, '.priceminmax.w-dropdown > nav', {
    className: 'filter-group-modal',
  });
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_BUY_BUTTON) {
    replaceByCheerio($, '[href^="https://buy.stripe.com"]', {
      href: process.env.NEXT_PUBLIC_BUY_BUTTON,
    });
  }
  if (hostname !== `${process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN}` || searchParams.paragon) {
    if (agent_data && agent_data.agent_id) {
      await fillAgentInfo($, agent_data, params);

      if (!possible_agent || possible_agent === '/') {
        listings = await getPropertiesFromAgentInventory(agent_data.agent_id);
        // Recent listings
        if (listings?.active?.length) {
          fillPropertyGrid($, listings.active, '.recent-listings-grid');
          fillPropertyGrid($, listings.active, '.featured-grid');
        } else {
          removeSection($, '.recent-listings-grid');
          removeSection($, '.featured-grid');
        }

        // Sold listings
        if (listings?.sold?.length) {
          fillPropertyGrid($, listings.sold, '.sold-listings-grid');
        } else {
          removeSection($, '.sold-listings-grid');
        }
      }
    } else {
      const session_key = cookies().get('session_key')?.value;
      if (session_key) {
        // TODO: write a cleaner implementation
        // Logic: retrieve agent record based on the assumption that the session_key is for a realtor regardless of the value for session_as

        const session = await getUserSessionData(`bearer ${session_key}`, 'realtor');
        if (session.agent_id) {
          agent_data = session as AgentData;
        }
      }
    }
    if (params?.slug) {
      if (agent_data?.metatags?.target_city) {
        $('[href="/map"]').attr('href', `/${params.slug}/map?q=${agent_data.metatags.target_city}`);
      } else {
        $('[href="/map"]').attr('href', `/${params.slug}/map?q=Vancouver`);
      }
    }

    if (params.slug === 'preview' && searchParams.lid) {
      property = await getPrivateListing(Number(searchParams.lid));
    } else if (
      params &&
      (params.slug === 'property' || params.slug === 'brochure' || params['site-page'] === 'property' || params['site-page'] === 'brochure') &&
      searchParams &&
      (searchParams.lid || searchParams.id || searchParams.mls)
    ) {
      if (searchParams.lid) {
        property = await getPrivateListing(Number(searchParams.lid));
      } else {
        // Publicly listed property page
        const cache_json = `${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${searchParams.mls}/recent.json`;
        try {
          const cached_xhr = await axios.get(cache_json);
          property = cached_xhr.data;

          if (property) {
            const legacy_json = `${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${searchParams.mls}/legacy.json`;
            try {
              const cached_legacy_xhr = await axios.get(legacy_json);
            } catch (e) {
              consoler(FILE, 'Property legacy data', legacy_json);
            }
          }
        } catch (e) {
          buildCacheFiles(searchParams.mls);
          property = await getPropertyData(searchParams.mls, true);
        }
      }
    }

    $('.w-webflow-badge').remove();
  }
  $('.w-webflow-badge').remove();

  const webflow: WebFlow = {
    head: {
      props: {
        ...$('html').attr(),
      },
      code: $('head').html() || '',
    },
    body: {
      code: $('body').html() || '',
      props: $('body').attr() || {},
    },
  };
  webflow_domain = headers().get('x-wf-domain') as string;

  if (webflow_domain) {
    if (webflow_domain.includes('leagent') === false) {
      let page = url.split('/').pop() || '';
      page = page.split('.html').join('');

      switch (page) {
        case 'client-dashboard':
          return <ClientDashboard params={{ slug: agent_data.agent_id }} />;
        case 'my-all-properties':
          return <MyAllProperties params={{ slug: agent_data.agent_id }} searchParams={searchParams} />;
        case 'my-home-alerts':
          return <MyHomeAlerts params={{ slug: agent_data.agent_id }} searchParams={searchParams} />;
      }
    }
    if (!LEAGENT_WEBFLOW_DOMAINS.includes(webflow_domain)) {
      return <PageComponent agent_id={headers().get('x-agent-id') as string} />;
    }
  }
  return (
    <>
      {webflow.body.code ? (
        <main className={styles['rx-realm']}>
          {rexify(webflow.body.code, agent_data, property, {
            ...params,
            origin,
            webflow_domain: hostname === 'localhost' ? TEST_WF_DOMAIN : hostname,
          })}
          <RxNotifications />
        </main>
      ) : (
        <main className={styles.main}>
          <div className={styles.grid}>Site maintenance. Come back later.</div>
        </main>
      )}
    </>
  );
}
