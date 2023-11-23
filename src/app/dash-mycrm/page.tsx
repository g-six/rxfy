import { cookies, headers } from 'next/headers';
import { getUserSessionData } from '../api/check-session/model';
import { AgentData } from '@/_typings/agent';
import RxCRM from '@/rexify/realtors/RxCRM';
import NotFound from '../not-found';
import { CheerioAPI, load } from 'cheerio';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { DOMNode, domToReact } from 'html-react-parser';
import { ReactElement } from 'react';
import RxNotifications from '@/components/RxNotifications';
import RxRealtorNav from '@/components/Nav/RxRealtorNav';

export default async function DashMyCrmPage() {
  const page_url = headers().get('x-url');
  const session_key = cookies().get('session_key')?.value;
  if (page_url && session_key) {
    const [page_results, realtor_results] = await Promise.all([fetch(page_url), getUserSessionData(session_key, 'realtor')]);
    const html = await page_results.text();
    if (html && realtor_results) {
      // Load html into Cheerio class
      const $: CheerioAPI = load(html);

      // and realtor
      const realtor = realtor_results as AgentData & { phone_number: string };

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
      return (
        <>
          <main className='dash-wrapper'>
            <RxRealtorNav>{domToReact(nav as unknown as DOMNode[]) as ReactElement}</RxRealtorNav>
            <RxCRM agent={realtor}>{domToReact($('body .dash-wrapper') as unknown as DOMNode[]) as ReactElement}</RxCRM>;
          </main>
          <RxNotifications />
        </>
      );
    }
  }
  return <NotFound />;
}
