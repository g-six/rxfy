import './globals.scss';
import parse from 'html-react-parser';
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
import { PageComponent } from './[slug]/[profile-slug]/page';

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

function log(start: number, message = 'done') {
  console.log(`[${Date.now() - start}ms] ${message}`);
}
export default async function Home({ params, searchParams }: { params: Record<string, unknown>; searchParams: Record<string, string> }) {
  const start = Date.now();
  log(start, 'started');
  const { TEST_WF_DOMAIN } = process.env as unknown as { [key: string]: string };
  const axios = (await import('axios')).default;
  const url = headers().get('x-url') as string;
  const { hostname, origin } = new URL(url);
  let agent_data: AgentData = {} as unknown as AgentData;
  let data, listings, property, legacy_data;
  let possible_agent = params.slug as string;
  let profile_slug = params['profile-slug'] as string;
  let session_key = cookies().get('session_key')?.value || '';
  let session_as = cookies().get('session_as')?.value || 'customer';

  if (!possible_agent && !profile_slug && headers().get('x-url') && `${headers().get('x-url')}`.split('/').pop() === 'index.html') {
    if (headers().get('x-agent-id') && headers().get('x-profile-slug')) {
      return <PageComponent agent_id={headers().get('x-agent-id') as string} />;
    }
  }

  if (possible_agent && profile_slug) {
    // Check if the slug matches a realtor
    if (profile_slug === 'leagent' || profile_slug.indexOf('la-') === 0) {
      console.log('Loading agent_record', possible_agent);
      const agent_record = await findAgentRecordByAgentId(possible_agent);
      const { metatags } = agent_record;

      if (agent_record) {
        agent_data = {
          ...agent_record,
        };

        if (!agent_data || !metatags.profile_slug || metatags.profile_slug !== profile_slug) {
          return <NotFound id='page-1' className='profile-not-found'></NotFound>;
        }
      } else {
        return <NotFound id='page-2' className='invalid-profile-slug'></NotFound>;
      }
    }
  } else if (session_key) {
    if (session_as === 'realtor') {
      console.log('Load agent data based on session_key', session_key);
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
    } else {
      console.log('Load customer data based on session_key', session_key);
    }
  }

  try {
    const req_page_html = await axios.get(headers().get('x-url') as string);
    data = req_page_html.data;
  } catch (e) {
    console.log('Unable to fetch page html for', headers().get('x-url'));
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
  log(start, 'response from webflow');

  if (params.slug && params['profile-slug']) {
    replaceByCheerio($, 'a.logo-div', {
      href: `/${params.slug}/${params['profile-slug']}`,
    });
  }

  let { hostname: webflow_domain, pathname: slug } = new URL(headers().get('x-url') as string);

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
      agent_data.webflow_domain = webflow_domain;
      loadAiResults($, agent_data.agent_id, agent_data.metatags.profile_slug, origin);
    }
  } else if (!(searchParams.theme && searchParams.agent) && webflow_domain === process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN) {
    log(start, 'running script for ' + webflow_domain);

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
                console.log('Featured listing not found');
              }
            }
            if (agent_data) {
              agent_data.metatags = session_agent.agent_metatag;
              loadAiResults($, session_agent.agent_id, agent_data.metatags.profile_slug, origin);
            }
          }
        } catch (e) {
          console.log('Invalid session key');
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
  log(start, 'done with conditional checking');

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

      if (!slug || slug === '/') {
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
      if (!agent_data.id) {
        console.log('\n\nHome.agent_data not available');
      } else {
        console.log('Retrieved agent_data through alternative means and assumptions');
        console.log(JSON.stringify({ agent_data }, null, 4));
      }
    }
    if (params?.['profile-slug'] && params?.slug) {
      if (agent_data?.metatags.target_city) {
        $('[href="/map"]').attr('href', `/${params.slug}/${params['profile-slug']}/map?q=${agent_data.metatags.target_city}`);
      } else {
        $('[href="/map"]').attr('href', `/${params.slug}/${params['profile-slug']}/map?q=Vancouver`);
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
          console.log('Loading cached file', cache_json);
          if (property) {
            const legacy_json = `${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${searchParams.mls}/legacy.json`;
            try {
              const cached_legacy_xhr = await axios.get(legacy_json);
              legacy_data = cached_legacy_xhr.data;
            } catch (e) {
              console.log('Property legacy data', legacy_json);
              console.log('No legacy cache, do the long query');
            }
          }
        } catch (e) {
          // No cache, do the long query
          console.log('building cache');
          buildCacheFiles(searchParams.mls);
          console.log('No cache, do the long query');
          property = await getPropertyData(searchParams.mls, true);
          legacy_data = property;
        }
      }
    }

    $('.w-webflow-badge').remove();
  } else {
    log(start, hostname + ' is being treated as webflow site: ' + process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN);
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
