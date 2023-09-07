import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { classNames } from '@/_utilities/html-helper';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { RxLoginPage } from '@/components/full-pages/RxLoginPage';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { Children, DOMElement, ReactElement, cloneElement } from 'react';

function Iterator({ children }: { children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props?.children !== 'string') {
      if (c.props.className?.includes('log-in-form')) {
        return <RxLoginPage className={classNames(c.props.className || 'no-default-class', 'rexified')}>{c.props.children}</RxLoginPage>;
      }
      return cloneElement(c, { className: classNames(c.props.className || 'no-default-class', 'rexified') }, <Iterator>{c.props.children}</Iterator>);
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default async function CustomerLogInPage(props: {
  params: {
    'profile-slug': string;
    slug: string;
  };
  searchParams: {
    [k: string]: string;
  };
}) {
  const { metatags, domain_name, webflow_domain, ...agent_data } = await findAgentRecordByAgentId(props.params.slug);
  let { data } = await axios.get(`https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/log-in.html`);

  // Replace webflow forms
  data = data.split('<form').join('<section').split('</form>').join('</section>');

  // absolute urls
  data = data.split('href="/').join(`href="${domain_name ? '/' : ['', agent_data.agent_id, metatags.profile_slug, ''].join('/')}`);

  const $: CheerioAPI = load(data);
  const body = $('body > div,section,footer');
  return <Iterator>{domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}</Iterator>;
}
