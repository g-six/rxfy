import { AgentData } from '@/_typings/agent';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { classNames } from '@/_utilities/html-helper';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import RxNotifications from '@/components/RxNotifications';
import { RxLoginPage } from '@/components/full-pages/RxLoginPage';
import { RxSignupPage } from '@/components/full-pages/RxSignupPage';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { Children, DOMElement, ReactElement, cloneElement } from 'react';

function Iterator({ agent_data, children }: { agent_data: AgentData; children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props?.children !== 'string') {
      // if (c.props.className?.includes('log-in-form')) {
      if (c.props.method) {
        return (
          <RxSignupPage
            agent={agent_data.id as number}
            logo={agent_data.metatags?.logo_for_light_bg}
            type={'div'}
            className={classNames(c.props.className || 'no-default-class', 'rexified')}
          >
            <>{c.props.children}</>
          </RxSignupPage>
        );
        // return <RxLoginPage className={classNames(c.props.className || 'no-default-class', 'rexified')}>{c.props.children}</RxLoginPage>;
      }
      return cloneElement(
        c,
        { className: classNames(c.props.className || 'no-default-class', 'rexified') },
        <Iterator agent_data={agent_data}>{c.props.children}</Iterator>,
      );
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default async function CustomerSignUpPage(props: {
  params: {
    'profile-slug': string;
    slug: string;
  };
  searchParams: {
    [k: string]: string;
  };
}) {
  const { metatags, domain_name, webflow_domain, ...agent_data } = await findAgentRecordByAgentId(props.params.slug);
  let data;
  console.log(agent_data);
  const req = await axios.get(`https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/sign-up.html`);
  data = req.data;
  // try {
  //   const req = await axios.get(`https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/sign-up.html`);
  //   data = req.data;
  // } catch (e) {
  //   console.log('static site not found, try webflow direct');
  //   const req = await axios.get(`https://${webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/sign-up`);
  //   data = req.data;
  // }

  // Replace webflow forms
  // data = data.split('<form').join('<section').split('</form>').join('</section>');

  // absolute urls
  data = data.split('href="/').join(`href="${domain_name ? '/' : ['', agent_data.agent_id, metatags.profile_slug, ''].join('/')}`);

  const $: CheerioAPI = load(data);
  $('form').each((i, item) => {
    item.tagName = 'div';
  });
  const body = $('body > div,section,footer');
  return (
    <>
      <Iterator agent_data={agent_data}>{domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}</Iterator>
      <RxNotifications />
    </>
  );
}
