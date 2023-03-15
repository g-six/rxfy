import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import styles from './page.module.css';
import { rexify } from '@/components/rexifier';
import { WebFlow } from '@/_typings/webflow';
import { getAgentDataFromWebflowDomain } from '@/_utilities/data-helpers/agent-helper';
import { getAgentListings } from '@/_utilities/data-helpers/listings-helper';
import { getPropertyData } from '@/_utilities/data-helpers/property-page';

const inter = Inter({ subsets: ['latin'] });

export default async function Home({
  params,
  searchParams,
}: {
  params: Record<string, unknown>;
  searchParams: Record<string, string>;
}) {
  const axios = (await import('axios')).default;
  const { TEST_DOMAIN } = process.env;
  const url = TEST_DOMAIN || headers().get('origin') || '';

  const { hostname, origin } = new URL(url);

  // Get Webflow page html
  const webflow_page_url =
    params && params.slug
      ? `${origin}/${params.slug}/${params.slug}id`
      : origin;

  const { data } = await axios.get(webflow_page_url);

  const agent_data = await getAgentDataFromWebflowDomain(hostname);
  let listings, property;

  if (
    params &&
    params.slug === 'property' &&
    searchParams &&
    searchParams.id
  ) {
    // Property page
    property = await getPropertyData(Number(searchParams.id));
  }
  if (agent_data && agent_data.agent_id) {
    listings = await getAgentListings(agent_data.agent_id);
  } else {
    console.log('\n\nHome.agent_data not available');
  }

  const $: CheerioAPI = load(data);
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
        rexify(webflow.body.code, agent_data, property)
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
            <Image
              className={styles.logo}
              src='/next.svg'
              alt='Next.js Logo'
              width={180}
              height={37}
              priority
            />
            <div className={styles.thirteen}>
              <Image
                src='/thirteen.svg'
                alt='13'
                width={40}
                height={31}
                priority
              />
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
              <p className={inter.className}>
                Find in-depth information about Next.js features and
                API.
              </p>
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
              <p className={inter.className}>
                Explore the Next.js 13 playground.
              </p>
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
              <p className={inter.className}>
                Instantly deploy your Next.js site to a shareable
                URL with Vercel.
              </p>
            </a>
          </div>
        </main>
      )}
    </>
  );
}
