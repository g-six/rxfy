import axios from 'axios';
import { Children, ReactElement, cloneElement } from 'react';
import { cookies } from 'next/headers';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { getFullAgentRecord } from '@/app/api/_helpers/agent-helper';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { replaceByCheerio } from '@/components/rexifier';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getUserSessionData } from '../api/check-session/route';
import RxRealtorNav from '@/components/Nav/RxRealtorNav';
import MyWebSiteSelectedTheme from './SelectedTheme.module';
import RxSearchEngineOptimizationTab from './seo/seo-rexifier.module';
import RxNotifications from '@/components/RxNotifications';
import DomainHowButton from './DomainHowButton.module';
import DomainHowModal from './DomainHowModal.module';

function Rexify({ children, ...props }: { children: ReactElement; realtor: AgentData }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props?.children !== 'string') {
      const { className, children: sub, ...wrapper } = c.props;
      if (className?.includes('selected-theme')) {
        return <MyWebSiteSelectedTheme {...props}>{c}</MyWebSiteSelectedTheme>;
      }
      if (wrapper['data-w-tab'] === 'Tab 2') {
        return <RxSearchEngineOptimizationTab realtor={props.realtor}>{c}</RxSearchEngineOptimizationTab>;
      }
      if (className?.includes('alert-regular')) {
        return <DomainHowButton className={className}>{sub}</DomainHowButton>;
      }
      if (className?.includes('domain-instructions')) {
        return <DomainHowModal className={className}>{sub}</DomainHowModal>;
      }
      return cloneElement(c, {}, <Rexify {...props}>{sub}</Rexify>);
    }
    return c;
  });
  return <>{Rexified}</>;
}

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
      const avatar = data.metatags.logo_for_light_bg || data.metatags.logo_for_dark_bg || data.metatags.headshot;

      const $: CheerioAPI = load(html);
      replaceByCheerio($, 'body > div > [class^="navigation-full-wrapper"] .agent-name', {
        content: data.full_name,
      });

      if (avatar) {
        replaceByCheerio($, 'body > div > [class^="navigation-full-wrapper"] .avatar-regular', {
          content: `<div class='w-full h-full inline-block bg-cover bg-center' style='background-image: url(${getImageSized(avatar, 120)});'></div>`,
        });
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
  }

  return <></>;
}
