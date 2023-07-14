import React from 'react';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import Head from 'next/head';
import { headers } from 'next/headers';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';

type Props = {
  searchParams: { [key: string]: string };
};

async function Iterator({ children }: { children: React.ReactElement }) {
  const Wrapped = React.Children.map(children, c => {
    if (['div', 'form', 'section'].includes(c.type as string)) {
      return (
        <div className={c.props.className || '' + ' rexified MapPage Iterator'}>
          <Iterator>{c.props.children}</Iterator>
        </div>
      );
    } else if (['a', 'label'].includes(c.type as string)) {
      return React.cloneElement(c, {
        ...c.props,
        children: React.Children.map(c.props.children, convertDivsToSpans),
      });
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default async function MapPage(p: unknown) {
  const url = headers().get('x-url');
  let title = 'Leagent Map';
  if (url) {
    let time = Date.now();
    const { data: html } = await axios.get(url);
    if (html) {
      const head_html = ('<head' + html.split('<head')[1].split('</head')[0] + '</head>').replace(/(<title>)(.*?)(<\/title>)/g, '$1' + title + '$3');
      console.log(Date.now() - time + 'ms', 'Finished pulling html data');
      const $: CheerioAPI = load(html);
      console.log(Date.now() - time + 'ms', 'Finished loading pulled html');
      const body = $('body > div');
      console.log(Date.now() - time + 'ms', 'Finished extracting body div');
      return (
        <>
          <Head>{head_html}</Head>
          <Iterator>{domToReact(body as unknown as DOMNode[]) as unknown as React.ReactElement}</Iterator>
        </>
      );
    }
  }
  return <>Page url is invalid or not found, please see app/map/page</>;
}
