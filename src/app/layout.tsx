import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';
import { ReactElement } from 'react';

export default async function Layout({ children }: { children: ReactElement }) {
  const url = headers().get('host');
  // const $: CheerioAPI = load(html)
  return (
    <>
      {children}
      {url}
    </>
  );
}
