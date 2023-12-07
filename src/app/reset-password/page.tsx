import { consoler } from '@/_helpers/consoler';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { headers } from 'next/headers';
import { ReactElement } from 'react';
import Iterator from './reset-password.iterator';
import RxNotifications from '@/components/RxNotifications';

export default async function RealtorLogInPage(p: { searchParams?: { [k: string]: string } }) {
  const url = headers().get('x-url') as string;
  const { pathname } = new URL(url);
  const FILE = `${pathname.substring(1).split('/').pop()}/page.tsx`.split('.html').join('');

  const results = await fetch(url);
  const html_markup = await results.text();
  const $: CheerioAPI = load(html_markup);

  const body = $('body > div');
  console.log(headers().get('host'));
  console.log(headers().get('host'));
  console.log(headers().get('host'));
  console.log(headers().get('host'));

  return (
    <>
      <Iterator agent-id={headers().get('x-record-id') || undefined} rx-file={FILE}>
        {domToReact(body as unknown as DOMNode[]) as ReactElement}
      </Iterator>
      ;
      <RxNotifications />
    </>
  );
}
