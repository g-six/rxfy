import parse from 'html-react-parser';
import Image from 'next/image';
import { CheerioAPI, load } from 'cheerio';
import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { Inter } from 'next/font/google';

import { WEBFLOW_NODE_SELECTOR, WebFlow } from '@/_typings/webflow';
import { MLSProperty } from '@/_typings/property';
import { AgentData } from '@/_typings/agent';
import { getAgentDataFromDomain } from '@/_utilities/data-helpers/agent-helper';
import { getAgentListings } from '@/_utilities/data-helpers/listings-helper';
import { getPrivatePropertyData, getPropertyData } from '@/_utilities/data-helpers/property-page';
import { fillAgentInfo, fillPropertyGrid, removeSection, replaceByCheerio, rexify } from '@/components/rexifier';
import RxNotifications from '@/components/RxNotifications';
import MyProfilePage from '@/rexify/my-profile';
import styles from './page.module.scss';
import { getUserDataFromSessionKey } from './api/update-session';
import { findAgentRecordByAgentId } from './api/agents/model';
import { AxiosError } from 'axios';
import NotFound from './not-found';

const inter = Inter({ subsets: ['latin'] });
const skip_slugs = ['favicon.ico', 'sign-out'];

function loadAiResults($: CheerioAPI, user_id: string, origin?: string) {
  ['oslo', 'hamburg', 'malta'].forEach(theme => {
    $(`.theme-area.home-${theme}`).replaceWith(
      `<iframe data-src="${origin}?paragon=${user_id}&theme=${theme}" className="${styles.homePagePreview} theme-area home-${theme}" />`,
    );
  });
  console.log('Load property sample', `${origin}/property?paragon=${user_id}&theme=default&mls=R2782417`);
  $(`[data-w-tab="Tab 2"] .f-section-large-11`).html(
    `<iframe src="${origin}/property?paragon=${user_id}&theme=default&mls=R2782417" className="${styles.homePagePreview}" />`,
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

export default async function Home({ params, searchParams }: { params: Record<string, unknown>; searchParams: Record<string, string> }) {
  const { TEST_DOMAIN } = process.env as unknown as { [key: string]: string };
  const axios = (await import('axios')).default;
  const url = headers().get('x-url') as string;
  const { hostname, pathname: original_path, origin } = new URL(url);
  let pathname = original_path;
  let agent_data: AgentData | undefined = undefined;
  let data, listings, property, legacy_data;
  let page_url = '';
  if (params?.slug && params?.['profile-slug']) {
    // Check if the slug matches a realtor
    pathname = '';
    const profile_slug = params?.['profile-slug'] as string;
    const possible_agent = params.slug as string;

    if (profile_slug.indexOf('la-') === 0) {
      const agent_record = await findAgentRecordByAgentId(possible_agent);
      const metatags = {
        ...agent_record?.agent_metatag?.data?.attributes,
      };

      if (agent_record) {
        agent_data = {
          ...agent_record,
        };

        if (params?.['site-page']) pathname = params['site-page'] as string;

        if (!agent_data || !metatags.profile_slug || metatags.profile_slug !== profile_slug) return <NotFound></NotFound>;
        page_url = `https://${agent_data.webflow_domain}/${pathname}`;
      } else {
        return <NotFound></NotFound>;
      }
    }
  }

  let session_key = cookies().get('session_key')?.value || '';

  if (['ai', 'ai-result'].includes(`${params?.slug || ''}`)) {
    page_url = `https://${process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN}/${params.slug || ''}`;
  } else if (!agent_data) {
    agent_data = await getAgentDataFromDomain(hostname === 'localhost' ? TEST_DOMAIN : hostname);
    page_url =
      agent_data?.webflow_domain && !['/ai', '/ai-result'].includes(pathname)
        ? `https://${agent_data.webflow_domain}`
        : `https://${process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN}`;
    // TODO: Refactor into Theme middleware
    if (searchParams.theme) {
      if (searchParams.theme === 'default') page_url = 'https://leagent-webflow-rebuild.webflow.io';
      else page_url = `https://${searchParams.theme}-leagent.webflow.io`;
    }
    page_url = params && params.slug && !skip_slugs.includes(params.slug as string) ? `${page_url}/${params.slug}` : page_url;
    if (params && params.slug === 'property') {
      page_url = `${page_url}/${params.slug}id`;
      console.log('fetching property page', page_url);
    } else {
      console.log('fetching page', page_url);
    }
  }

  try {
    const req_page_html = await axios.get(page_url);
    data = req_page_html.data;
  } catch (e) {
    console.log('Unable to fetch page html for', page_url);
  }

  if (typeof data !== 'string') {
    data = '<html><head><meta name="title" content="Not found" /></head><body>Not found</body></html>';
    notFound();
  }
  const $: CheerioAPI = load(data);
  let { hostname: webflow_domain, pathname: slug } = new URL(page_url);
  $('form').removeAttr('id');
  $('form').removeAttr('name');
  if (process.env.NEXT_PUBLIC_BUY_BUTTON)
    replaceByCheerio($, '.btn-stripe-buy', {
      href: process.env.NEXT_PUBLIC_BUY_BUTTON,
    });

  // Special cases
  if (searchParams.paragon) {
    axios
      .get(`${process.env.NEXT_PUBLIC_API}/opensearch/agent-listings/${searchParams.paragon}?regen=1`)
      .then(response => {
        console.log('Successfully retrieved agent cache json');
      })
      .catch(e => {
        const axerr = e as AxiosError;
        console.log(`Error in generating ${process.env.NEXT_PUBLIC_API}/opensearch/agent-listings/${searchParams.paragon}?regen=1`, axerr.response?.status);
      });
    agent_data = await findAgentRecordByAgentId(searchParams.paragon);

    if (agent_data) {
      if (searchParams.theme === 'default') webflow_domain = 'leagent-webflow-rebuild.webflow.io';
      agent_data.webflow_domain = webflow_domain;
      loadAiResults($, agent_data.agent_id, origin);
    }
  } else if (!(searchParams.theme && searchParams.agent) && agent_data?.webflow_domain === 'leagent-website.webflow.io') {
    if (!session_key && params.slug && ['ai-result'].includes(params.slug as string)) {
      data = '<html><head><meta name="title" content="Not found" /></head><body>Not found</body></html>';
      notFound();
    }
    if (session_key && params.slug !== 'ai') {
      const [session_hash, user_id] = session_key.split('-');

      if (session_hash && user_id) {
        try {
          const session = await getUserDataFromSessionKey(session_hash, Number(user_id), 'realtor');
          agent_data = session.agent;

          if (session.agent) {
            if (session.agent?.featured_listings?.length) {
              try {
                await axios.get(`https://beta.leagent.com/api/properties/mls-id/${session.agent.featured_listings[0]}`);
                const feature_listing = await axios.get(`${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${session.agent.featured_listings[0]}/recent.json`);
                property = feature_listing.data;
                property.listing_by = `Listing courtesy of ${session.agent.full_name}`;
              } catch (e) {
                console.log('Featured listing not found');
              }
            }
            if (agent_data) {
              agent_data.metatags = session.agent.agent_metatag;
              loadAiResults($, session.agent.agent_id, origin);
            }
            console.log('test');
          }
        } catch (e) {
          console.log('Invalid session key');
        }
      }
    }

    switch (params.slug) {
      case 'my-profile':
        return (
          <>
            <MyProfilePage
              data={{ session_key, 'user-type': hostname === (process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN as string) ? 'realtor' : 'customer' }}
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

  if (hostname !== `${process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN}` || searchParams.paragon) {
    if (agent_data && agent_data.agent_id) {
      await fillAgentInfo($, agent_data);

      if (!slug || slug === '/') {
        listings = await getAgentListings(agent_data.agent_id);
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
      console.log('\n\nHome.agent_data not available');
    }
    if (params?.['profile-slug'] && params?.slug) {
      console.log(params);
      if (agent_data?.metatags.target_city) {
        $('[href="/map"]').attr('href', `/${params.slug}/${params['profile-slug']}/map?q=${agent_data.metatags.target_city}`);
      } else {
        $('[href="/map"]').attr('href', `/${params.slug}/${params['profile-slug']}/map?q=Vancouver`);
      }
    }

    if (params && (params.slug === 'property' || params.slug === 'brochure') && searchParams && (searchParams.lid || searchParams.id || searchParams.mls)) {
      if (searchParams.lid) {
        property = await getPrivatePropertyData(searchParams.lid);
      } else {
        // Publicly listed property page
        if (searchParams.id) {
          property = await getPropertyData(searchParams.id);
        } else {
          try {
            const cached_xhr = await axios.get(`${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${searchParams.mls}/recent.json`);
            const cached_legacy_xhr = await axios.get(`${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${searchParams.mls}/legacy.json`);
            property = cached_xhr.data;
            legacy_data = cached_legacy_xhr.data;
          } catch (e) {
            // No cache, do the long query
            property = await getPropertyData(searchParams.mls, true);
            legacy_data = property;
          }
        }
        const { LA1_FullName, LA2_FullName, LA3_FullName, SO1_FullName, SO2_FullName, SO3_FullName, LO1_Name, LO2_Name, LO3_Name } =
          legacy_data as unknown as MLSProperty;

        replaceByCheerio($, '.legal-text', {
          content: property.real_estate_board?.data?.attributes?.legal_disclaimer || '',
        });

        const listing_by =
          LA1_FullName || LA2_FullName || LA3_FullName || SO1_FullName || SO2_FullName || SO3_FullName || LO1_Name || LO2_Name || LO3_Name || '';
        replaceByCheerio($, '.listing-by', {
          content: listing_by ? `Listing courtesy of ${listing_by}` : '',
        });
      }
    }

    $('.w-webflow-badge').remove();
  } else {
    console.log(hostname, 'is being treated as webflow site:', process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN);
  }
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
            webflow_domain: hostname === 'localhost' ? TEST_DOMAIN : hostname,
          })}
          <RxNotifications />
        </main>
      ) : (
        <main className={styles.main}>
          <div className={styles.description}>
            <p>
              Get started by editing&nbsp;
              <code className={styles.code}>src/app/page.tsx</code>
            </p>
            <div>
              <a
                href='https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
                target='_blank'
                rel='noopener noreferrer'
              >
                By 50CodesOfGrey
              </a>
            </div>
          </div>

          <div className={styles.center}>
            <Image className={styles.logo} src='/next.svg' alt='Next.js Logo' width={180} height={37} priority />
            <div className={styles.thirteen}>
              <Image src='/thirteen.svg' alt='13' width={40} height={31} priority />
            </div>
          </div>

          <div className={styles.grid}>
            <a
              href='https://beta.nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
              className={styles.card}
              target='_blank'
              rel='noopener noreferrer'
            >
              <h2 className={inter.className}>
                Docs <span>-&gt;</span>
              </h2>
              <p className={inter.className}>Find in-depth information about Next.js features and API.</p>
            </a>

            <a
              href='https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
              className={styles.card}
              target='_blank'
              rel='noopener noreferrer'
            >
              <h2 className={inter.className}>
                Templates <span>-&gt;</span>
              </h2>
              <p className={inter.className}>Explore the Next.js 13 playground.</p>
            </a>

            <a
              href='https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
              className={styles.card}
              target='_blank'
              rel='noopener noreferrer'
            >
              <h2 className={inter.className}>
                Deploy <span>-&gt;</span>
              </h2>
              <p className={inter.className}>Instantly deploy your Next.js site to a shareable URL with Vercel.</p>
            </a>
          </div>
        </main>
      )}
    </>
  );
}
