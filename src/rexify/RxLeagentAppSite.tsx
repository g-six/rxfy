import { CheerioAPI } from 'cheerio';
import React from 'react';

type Props = {
  children: React.ReactElement;
  session: any;
};
export default function RxLeagentAppSite(p: Props) {
  /**
   *
   */
  return <div>{p.children}</div>;
}
