import { ReactElement } from 'react';
import { cookies, headers } from 'next/headers';
import { CheerioAPI, load } from 'cheerio';
import { AgentData } from '@/_typings/agent';
import { getUserSessionData } from '../api/check-session/model';
import RxRealtorNav from '@/components/Nav/RxRealtorNav';
import { DOMNode, domToReact } from 'html-react-parser';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { Rexify } from './page.rexifier';
import NotFound from '../not-found';
import RxNotifications from '@/components/RxNotifications';
import { redirect } from 'next/navigation';

/**
 * This is the Realtor's my-profile page
 */
export default async function MyProfile() {
  const page_url = headers().get('x-url');
  const session_key = cookies().get('session_key')?.value || '';

  if (page_url) {
    const [page_results, realtor_results] = await Promise.all([fetch(page_url), getUserSessionData(session_key, 'realtor')]);

    const html = await page_results.text();
    if (html && realtor_results) {
      // Realtor
      const realtor = realtor_results as AgentData & { phone_number: string; error?: string };
      if (realtor.error) {
        redirect('/log-in');
        return <></>;
      }
      // Load html into Cheerio class
      const $: CheerioAPI = load(html);

      // If no longer on trial
      if (realtor.subscription?.status !== 'trialing') {
        $('body > div > [class^="navigation-full-wrapper"] .free-trial-tag').remove();
      }

      $('[data-field="full_name"]').html(realtor.full_name);
      if (realtor.metatags?.headshot) {
        $('[data-field="headshot"]').html(
          `<div style="background-image: url(${getImageSized(realtor.metatags.headshot, 150)})" class="w-36 h-36 bg-cover bg-no-repeat bg-center block" />`,
        );
      }

      // Isolate nav
      const nav = $('body > div > [class^="navigation-full-wrapper"]');
      $('body > div > [class^="navigation-full-wrapper"]').remove();

      const scripts = $('body script');

      return (
        <>
          <main className='dash-wrapper'>
            <RxRealtorNav>{domToReact(nav as unknown as DOMNode[]) as ReactElement}</RxRealtorNav>
            <Rexify agent={realtor}>{domToReact($('body .dash-wrapper') as unknown as DOMNode[]) as ReactElement}</Rexify>
          </main>
          <RxNotifications />
        </>
      );
    }
  }
  return <NotFound />;
}
