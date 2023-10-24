import axios from 'axios';
import { cookies } from 'next/headers';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { getFullAgentRecord } from '@/app/api/_helpers/agent-helper';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { replaceByCheerio } from '@/components/rexifier';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import RxRealtorNav from '@/components/Nav/RxRealtorNav';
import RxNotifications from '@/components/RxNotifications';
import { getUserSessionData } from '../api/check-session/model';
import { redirect } from 'next/navigation';
import { Rexify } from './page.rexifier';

export default async function MyWebSite() {
  const session_key = cookies().get('session_key')?.value;
  if (session_key) {
    const { data: html } = await axios.get('https://' + WEBFLOW_DASHBOARDS.REALTOR + '/my-website');
    const realtor = (await getUserSessionData(session_key, 'realtor')) as AgentData;

    if (html && realtor) {
      const data = {
        ...realtor,
        ...getFullAgentRecord({
          ...(realtor as AgentData),
          agent_metatag: {
            data: {
              id: realtor.metatags.id,
              attributes: realtor.metatags as unknown as { [k: string]: unknown },
            },
          },
        }),
      };
      const $: CheerioAPI = load(html);
      replaceByCheerio($, 'body > div > [class^="navigation-full-wrapper"] .agent-name', {
        content: data.full_name,
      });

      if (realtor.metatags?.headshot) {
        $('[data-field="headshot"]').html(
          `<div style="background-image: url(${getImageSized(realtor.metatags.headshot, 150)})" class="w-36 h-36 bg-cover bg-no-repeat bg-center block" />`,
        );
      }

      if (realtor.subscription?.status !== 'trialing') {
        $('body > div > [class^="navigation-full-wrapper"] .free-trial-tag').remove();
      }
      const nav = $('body > div > [class^="navigation-full-wrapper"]');
      return (
        <>
          <main className={$('body > div').attr('class')}>
            <RxRealtorNav>{domToReact(nav as unknown as DOMNode[]) as React.ReactElement}</RxRealtorNav>
            <Rexify realtor={realtor}>{domToReact($('body > div > [data-dash]') as unknown as DOMNode[]) as React.ReactElement}</Rexify>
          </main>
          <RxNotifications />
        </>
      );
    }
  } else {
    redirect('/log-in');
  }

  return <></>;
}
