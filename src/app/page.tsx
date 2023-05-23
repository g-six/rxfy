import { CheerioAPI, load } from 'cheerio';
import parse from 'html-react-parser';
import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import styles from './page.module.scss';
import { fillAgentInfo, fillPropertyGrid, removeSection, replaceByCheerio, rexify } from '@/components/rexifier';
import { WebFlow } from '@/_typings/webflow';
import { getAgentDataFromDomain } from '@/_utilities/data-helpers/agent-helper';
import { getAgentListings } from '@/_utilities/data-helpers/listings-helper';
import { getPrivatePropertyData, getPropertyData } from '@/_utilities/data-helpers/property-page';
import { MLSProperty } from '@/_typings/property';
import Script from 'next/script';
import { addPropertyMapScripts } from '@/components/Scripts/google-street-map';
import { AgentData, BrokerageInputModel, RealtorInputModel } from '@/_typings/agent';
import RxNotifications from '@/components/RxNotifications';
import MyProfilePage from '@/rexify/my-profile';
import { getRealEstateBoard } from '@/app/api/real-estate-boards/model';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

const inter = Inter({ subsets: ['latin'] });
const skip_slugs = ['favicon.ico'];
export default async function Home({ params, searchParams }: { params: Record<string, unknown>; searchParams: Record<string, string> }) {
  const { TEST_DOMAIN } = process.env as unknown as { [key: string]: string };
  const axios = (await import('axios')).default;
  const url = headers().get('x-url') as string;
  const { hostname, pathname, origin } = new URL(url);

  const session_key = cookies().get('session_key')?.value || '';
  const is_realtor = cookies().get('session_as')?.value === 'realtor';

  const agent_data: AgentData = await getAgentDataFromDomain(hostname === 'localhost' ? TEST_DOMAIN : hostname);
  let webflow_page_url =
    params && params.slug && !skip_slugs.includes(params.slug as string)
      ? `https://${agent_data.webflow_domain}/${params.slug}`
      : `https://${agent_data.webflow_domain}`;

  if (params && params.slug === 'property') {
    webflow_page_url = `${webflow_page_url}/${params.slug}id`;
    console.log('fetching property page', webflow_page_url);
  }

  let data;

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
  if (agent_data.webflow_domain === 'leagent-website.webflow.io' && params.slug === 'my-profile') {
    let session;
    if (session_key && is_realtor) {
      // const api_response = await axios
      //   .get(`/api/check-session/agent`, {
      //     headers: {
      //       Authorization: `Bearer ${session_key}`,
      //     },
      //   })
      //   .catch(e => {
      //     const axerr = e as AxiosError;
      //     console.log({ pathname, origin });
      //     console.log('page / leagent-website.webflow.io User not logged in');
      //     console.log(axerr.message);
      //   });
      // session = api_response as unknown as RealtorInputModel & {
      //   brokerage: BrokerageInputModel;
      //   session_key: string;
      // };
    }
    return <MyProfilePage data={{ session_key }}>{parse($.html()) as unknown as JSX.Element}</MyProfilePage>;
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

    if (property) {
      const d = property as unknown as MLSProperty;
      let photo_fill_count = 0;
      const photos: string[] = d.photos as string[];
      if (photos && photos.length) {
        $('.property-photos-grid img').each((i, e) => {
          if (photos[i]) {
            const src = getImageSized(photos[i], i === 0 ? 860 : 560);
            photo_fill_count++;
            let status_class = 'active';
            if (d.status) status_class = `${d.status}`.toLowerCase();
            $(e).replaceWith(
              `<div class="cursor-pointer ${status_class}-photo ${e.attribs.class || ''}" data-nth-child="${i + 1}" data-lg-src="${getImageSized(
                photos[i],
                860,
              )}" style="background-position: center center; background-image: url('${src}');" />`,
            );
          }
        });

        // Lower portion
        if (photos.length < 4) {
          $('.section-images').remove();
        } else {
          $('.section-images img').each((i, e) => {
            photo_fill_count++;
            const cnt = i + 3;
            const src = getImageSized(photos[cnt], 480);
            $(e).replaceWith(
              `<div class="cursor-pointer ${e.attribs.class || ''}" data-nth-child="${cnt + 1}" data-lg-src="${getImageSized(
                photos[cnt],
                860,
              )}" style="background-position: center center; background-image: url('${src}');" />`,
            );
          });
        }
        photos.forEach((src, num) => {
          $('.property-images-lightbox').append(`<div class="property-carousel-item" data-nth-child="${num + 1}" data-src="${src}" />`);
        });
      }
      $('a.property-images-lightbox').replaceWith(
        `<div class="${$('a.property-images-lightbox').attr('class')}">${$('a.property-images-lightbox').html()}</div>`,
      );
      $('.section-images a.w-lightbox').replaceWith(
        `<div class="${$('.section-images a.w-lightbox').attr('class')}">${$('.section-images a.w-lightbox').html()}</div>`,
      );

      // Photo gallery for properties
      /*
      const photos: string[] = d.photos as string[];
      if (photos) {
        $('a.link').each((e, el) => {
          el.children.forEach((child, child_idx: number) => {
            if (photos[child_idx]) {
              if (child.type === 'script') {
                const img_json = JSON.parse($(child).html() as string);
                img_json.items[child_idx].url = photos[child_idx];
                $(child).replaceWith(`<script class="w-json" type="application/json">${JSON.stringify(img_json, null, 4)}</script>`);
              } else if ((child as { name: string }).name === 'img') {
                $(child).attr('src', photos[child_idx]);
                $(child).removeAttr('srcset');
                $(child).removeAttr('sizes');
              }
            }
          });
        });
        if ($('a.link').length < photos.length) {
          const parent = $('a.link:first').parentsUntil('#propertyimages');
          // const otherparent = $('.property-images-grid:first').parentsUntil('a');
          $('.property-image-wrapper img').attr('src', `${process.env.NEXT_APP_IM_ENG}/w_999/${photos[0]}`);
          $('.property-image-wrapper img').attr(
            'srcset',
            [500, 800, 999]
              .map(size => {
                return `${process.env.NEXT_APP_IM_ENG}/w_${size}/${photos[0]} ${size}w`;
              })
              .join(', '),
          );
          $('.property-images-more img').each((img_number, img_2and3) => {
            if (photos.length > img_number) {
              img_2and3.attribs.src = `${process.env.NEXT_APP_IM_ENG}/w_999/${photos[img_number + 1]}`;
              img_2and3.attribs.srcset = [500, 800, 999]
                .map(size => {
                  return `${process.env.NEXT_APP_IM_ENG}/w_${size}/${photos[img_number + 1]} ${size}w`;
                })
                .join(', ');
            }
          });
          try {
            const { items, group } = JSON.parse($('.property-images-lightbox script').text());
            const updated_images: { url: string }[] = [];
            items.forEach((item: { url: string }, idx: number) => {
              updated_images.push({
                ...item,
                url: `${process.env.NEXT_APP_IM_ENG}/w_999/${photos[idx]}`,
              });
            });

            $('.property-images-lightbox script').text(
              JSON.stringify(
                {
                  items: updated_images,
                  group,
                },
                null,
                4,
              ),
            );
          } catch (err) {
            console.log('Skipping property-images-lightbox for ', params.slug);
            console.error(err);
          } finally {
            console.log('Done rexifying gallery');
          }
          if (photos.length > 3)
            photos.slice(3).forEach((url: string, thumb_idx: number) => {
              const selector = `img.property-images-grid:nth-child(${thumb_idx + 1})`;
              $(selector).attr('src', `${process.env.NEXT_APP_IM_ENG}/w_500/${url}`);
              $(selector).attr(
                'srcset',
                [500, 800, 999]
                  .map(size => {
                    return `${process.env.NEXT_APP_IM_ENG}/w_${size}/${url} ${size}w`;
                  })
                  .join(', '),
              );

              parent.append(`<a href="#" class="lightbox-link link w-inline-block w-lightbox hidden" aria-label="open lightbox" aria-haspopup="dialog">
          <img src="${process.env.NEXT_APP_IM_ENG}/w_999/${url}" loading="eager" alt="" class="cardimage" />
          <script class="w-json" type="application/json">{
            "items": [
                {
                    "url": "${process.env.NEXT_APP_IM_ENG}/w_1280/${url}",
                    "type": "image"
                }
            ],
            "group": "Property Images"
        }</script>
          </a>`);
            });
        }
        
      }*/
    }

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
      {property && property.lat && (
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
