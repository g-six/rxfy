import parse from 'html-react-parser';
import Image from 'next/image';
import { CheerioAPI, load } from 'cheerio';
import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { Inter } from 'next/font/google';

import { WebFlow } from '@/_typings/webflow';
import { MLSProperty } from '@/_typings/property';
import { AgentData, BrokerageInputModel, RealtorInputModel } from '@/_typings/agent';
import { getAgentDataFromDomain } from '@/_utilities/data-helpers/agent-helper';
import { getAgentListings } from '@/_utilities/data-helpers/listings-helper';
import { getPrivatePropertyData, getPropertyData } from '@/_utilities/data-helpers/property-page';
import { fillAgentInfo, fillPropertyGrid, removeSection, replaceByCheerio, rexify } from '@/components/rexifier';
import RxNotifications from '@/components/RxNotifications';
import MyProfilePage from '@/rexify/my-profile';
import styles from './page.module.scss';
import { AxiosError } from 'axios';
import { getNewSessionKey, getUserDataFromSessionKey } from './api/update-session';
import { replace } from 'cypress/types/lodash';

const inter = Inter({ subsets: ['latin'] });
const skip_slugs = ['favicon.ico'];
export default async function Home({ params, searchParams }: { params: Record<string, unknown>; searchParams: Record<string, string> }) {
  const { TEST_DOMAIN } = process.env as unknown as { [key: string]: string };
  const axios = (await import('axios')).default;
  const url = headers().get('x-url') as string;
  const { hostname, pathname, origin } = new URL(url);

  let session_key = cookies().get('session_key')?.value || '';

  let agent_data: AgentData = await getAgentDataFromDomain(hostname === 'localhost' ? TEST_DOMAIN : hostname);
  let webflow_page_url =
    params && params.slug && !skip_slugs.includes(params.slug as string)
      ? `https://${agent_data.webflow_domain}/${params.slug}`
      : `https://${agent_data.webflow_domain}`;

  if (params && params.slug === 'property') {
    webflow_page_url = `${webflow_page_url}/${params.slug}id`;
    console.log('fetching property page', webflow_page_url);
  }

  let data, realtor;

  try {
    const req_page_html = await axios.get(webflow_page_url);
    data = req_page_html.data;
  } catch (e) {
    console.log('Unable to fetch page html for', webflow_page_url);
  }

  if (typeof data !== 'string') {
    data = '<html><head><meta name="title" content="Not found" /></head><body>Not found</body></html>';
    notFound();
  }
  const $: CheerioAPI = load(data);

  // Special cases
  if (agent_data.webflow_domain === 'leagent-website.webflow.io') {
    let session;
    if (session_key && params.slug !== 'ai') {
      const [session_hash, user_id] = session_key.split('-');
      const new_session = await getUserDataFromSessionKey(session_hash, Number(user_id), 'realtor');
      if (new_session.id) {
        realtor = new_session;
        $('.logo-n-contact .agent-name').text(realtor.agent.full_name);
        agent_data = realtor.agent;
        if (realtor.agent.agent_metatag) {
          agent_data.metatags = realtor.agent.agent_metatag;
          if (agent_data.metatags.personal_title && agent_data.metatags.personal_title.length > 50) {
            agent_data.metatags.personal_title = agent_data.metatags.personal_title.split(' ').slice(0, 5).join(' ');
          }
          $('.section---search .address-chipss [href="#"]').each((i, el) => {
            if (el) $(el).remove();
          });
        }
        replaceByCheerio($, '.theme-area.home-oslo > div', {
          className: styles.scaledHomePage,
        });
        if (realtor.agent.featured_listings?.length) {
          const [feature_mls_id] = realtor.agent.featured_listings;
          try {
            const feature_listing = await axios.get(`${process.env.NEXT_APP_LISTINGS_CACHE}/${feature_mls_id}/recent.json`);
            if (feature_listing.data) {
              const image_wrappers = ['.property-image-wrapper', '.image-wrapper-top', '.image-wrapper-bottom'];
              const { area, baths, beds, description, floor_area, photos, year_built } = feature_listing.data;
              photos.forEach((photo_url: string, photo_num: number) => {
                replaceByCheerio($, image_wrappers[photo_num] + ' img', {
                  photo: `${process.env.NEXT_APP_IM_ENG}/w_620/${photo_url}`,
                });
              });

              replaceByCheerio($, '.bedbath-result.number-of-beds', {
                content: beds,
              });
              replaceByCheerio($, '.bedbath-result.number-of-baths', {
                content: baths,
              });
              replaceByCheerio($, '.bedbath-result.year-built', {
                content: year_built,
              });
              replaceByCheerio($, '.bedbath-result.sqft', {
                content: new Intl.NumberFormat().format(floor_area) + 'sqft',
              });
              replaceByCheerio($, '.bedbath-result.area', {
                content: area,
              });
              replaceByCheerio($, '.listing-description', {
                content: description,
              });
              replaceByCheerio($, '.listing-by', {
                content: 'Listing courtesy of ' + realtor.agent.full_name,
              });
            }
          } catch (e) {
            console.log('Unable to retrieve a listing sample');
          }

          // realtor.agent.featured_listings[0].photos.forEach((photo: string, wrapper_num: number) => {
          //   replaceByCheerio($, image_wrappers[wrapper_num] + ' img', {
          //     photo,
          //   });
          // });
        }
        // const malta = await axios.get('https://malta-leagent.webflow.io');
        // const $malta: CheerioAPI = load(malta.data);
        // $('.home-malta').html(($malta('body').html() as string).split('script>').join('descript>'));
      }
    }
    switch (params.slug) {
      case 'my-profile':
        return <MyProfilePage data={{ session_key }}>{parse($.html()) as unknown as JSX.Element}</MyProfilePage>;
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

  let listings, property, legacy_data;

  if (agent_data.webflow_domain != 'leagent-website.webflow.io') {
    if (!params || !params.slug || params.slug === '/') {
      if (agent_data && agent_data.agent_id) {
        listings = await getAgentListings(agent_data.agent_id);
        // Recent listings
        if (listings?.active?.length) {
          fillPropertyGrid($, listings.active, '.recent-listings-grid');
        } else {
          removeSection($, '.recent-listings-grid');
        }

        // Sold listings
        if (listings?.sold?.length) {
          fillPropertyGrid($, listings.sold, '.sold-listings-grid');
        } else {
          removeSection($, '.sold-listings-grid');
        }
      } else {
        console.log('\n\nHome.agent_data not available');
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
            const cached_xhr = await axios.get(`${process.env.NEXT_APP_LISTINGS_CACHE}/${searchParams.mls}/recent.json`);
            const cached_legacy_xhr = await axios.get(`${process.env.NEXT_APP_LISTINGS_CACHE}/${searchParams.mls}/legacy.json`);
            property = cached_xhr.data;
            console.log({ searchParams }, `${process.env.NEXT_APP_LISTINGS_CACHE}/${searchParams.mls}/recent.json found`);
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
    await fillAgentInfo($, agent_data);

    $('.w-webflow-badge').remove();
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
          {rexify(webflow.body.code, agent_data, property, params)}
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
