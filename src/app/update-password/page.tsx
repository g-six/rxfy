import { headers } from 'next/headers';
import { getUserSessionData } from '../api/check-session/model';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import UpdatePasswordPageRexifier from './update-password-page.rexifier';
import { ReactElement } from 'react';
import RxNotifications from '@/components/RxNotifications';

export default async function UpdatePasswordPage({ searchParams }: { searchParams: { [k: string]: string } }) {
  const url = headers().get('x-url');
  const { key } = searchParams;

  if (url) {
    if (key) {
      const customer = await getUserSessionData(`Bearer ${key}`, url.includes('leagent-website') ? 'realtor' : 'customer');
      if (customer) console.log(JSON.stringify(customer, null, 4));
    }
    const page_req = await fetch(url);
    if (page_req.ok) {
      const html = await page_req.text();
      const $: CheerioAPI = await load(html);
      const body = $('body > div');
      return (
        <>
          <UpdatePasswordPageRexifier>{domToReact(body as unknown as DOMNode[]) as ReactElement}</UpdatePasswordPageRexifier>
          <RxNotifications />
        </>
      );
    }
  }
  console.log({ url });
  return <></>;
}
