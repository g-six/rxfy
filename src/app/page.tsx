import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import styles from './page.module.scss';
import { fillAgentInfo, fillPropertyGrid, removeSection, replaceByCheerio, rexify } from '@/components/rexifier';
import { WebFlow } from '@/_typings/webflow';
import { getAgentDataFromDomain } from '@/_utilities/data-helpers/agent-helper';
import { getAgentListings } from '@/_utilities/data-helpers/listings-helper';
import { getPrivatePropertyData, getPropertyData, getRecentListings, getSimilarHomes } from '@/_utilities/data-helpers/property-page';
import { MLSProperty } from '@/_typings/property';
import Script from 'next/script';
import { addPropertyMapScripts } from '@/components/Scripts/google-street-map';
import { AgentData } from '@/_typings/agent';
import RxNotifications from '@/components/RxNotifications';

const inter = Inter({ subsets: ['latin'] });

export default async function Home({ params, searchParams }: { params: Record<string, unknown>; searchParams: Record<string, string> }) {
  const axios = (await import('axios')).default;
  const url = headers().get('x-url') as string;
  const { hostname, origin } = new URL(url);

  const agent_data: AgentData = await getAgentDataFromDomain(hostname === 'localhost' ? 'rx.leagent.com' : hostname);
  let webflow_page_url = params && params.slug ? `https://${agent_data.webflow_domain}/${params.slug}` : `https://${agent_data.webflow_domain}`;

  if (params && params.slug === 'property') {
    webflow_page_url = `${webflow_page_url}/${params.slug}id`;
  }

  const { data } = await axios.get(webflow_page_url);

  const $: CheerioAPI = load(data);

  replaceByCheerio($, '.search-input-field', {
    prepend: `<input class="txt-search-input" name="search-input" id="search-input" type="text" value="${(searchParams && searchParams.city) || ''}" />`,
  });

  let listings, property;

  if (!params || !params.slug || params.slug === '/') {
    if (agent_data && agent_data.agent_id) {
      listings = await getAgentListings(agent_data.agent_id);

      if (!listings.active || listings.active?.length === 0) {
        const recent_listings = await getRecentListings(agent_data, 12);
        listings = {
          ...listings,
          active: recent_listings,
        };
      }
    } else {
      console.log('\n\nHome.agent_data not available');
    }
  }
  if (params && params.slug === 'compare') {
  }
  if (params && params.slug === 'property' && searchParams && (searchParams.lid || searchParams.id || searchParams.mls)) {
    if (searchParams.lid) {
      property = await getPrivatePropertyData(searchParams.lid);
    } else {
      // Publicly listed property page
      property = await getPropertyData(searchParams.id || searchParams.mls, !!searchParams.mls);
    }
  }
  await fillAgentInfo($, agent_data);
  // Recent listings
  if (listings?.active?.length) {
    fillPropertyGrid($, listings.active, '.recent-listings-grid');
  } else {
    removeSection($, '.recent-listings-grid');
  }

  // Sold listings
  if (listings?.sold?.length) {
    fillPropertyGrid($, listings.sold as unknown as MLSProperty[], '.sold-listings-grid');
  } else {
    removeSection($, '.sold-listings-grid');
  }

  if (property) {
    // Photo gallery for properties
    const d = property as unknown as MLSProperty;
    const photos: string[] = d.photos as string[];
    const similar_properties = await getSimilarHomes(property as unknown as MLSProperty);
    property = {
      ...property,
      similar_properties,
    };

    if (similar_properties.length) {
      fillPropertyGrid($, similar_properties);
    }

    $('a.link').each((e, el) => {
      el.children.forEach(child => {
        if (photos[e]) {
          if (child.type === 'script') {
            const img_json = JSON.parse($(child).html() as string);
            img_json.items[0].url = photos[e];
            JSON.stringify(img_json, null, 4);
            $(child).replaceWith(`<script class="w-json" type="application/json">${JSON.stringify(img_json, null, 4)}</script>`);
          } else if ((child as { name: string }).name === 'img') {
            $(child).attr('src', photos[e]);
            $(child).removeAttr('srcset');
            $(child).removeAttr('sizes');
          }
        }
      });
    });
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
          {rexify(webflow.body.code, agent_data, property)}
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
      {property && property.lat && property.lng && (
        <Script
          defer
          suppressHydrationWarning
          id='property-map-init'
          dangerouslySetInnerHTML={{
            __html: addPropertyMapScripts(property),
          }}
        />
      )}
    </>
  );
}
