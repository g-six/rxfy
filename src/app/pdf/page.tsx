import React from 'react';
import { getPdf } from '@/app/api/_helpers/pdf-helper';
import { getPropertyByMlsId } from '@/app/api/properties/model';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import html2canvas from 'html2canvas';
import { domToReact, htmlToDOM } from 'html-react-parser';

export default async function PdfPage({ searchParams }: any) {
  let pdf = '';
  if (searchParams.agent && searchParams.slug && searchParams.mls) {
    const agent = await findAgentRecordByAgentId(searchParams.agent as string);
    const data = await getPropertyByMlsId(searchParams.mls as string);

    const full_data = {
      ...data,
      agent,
    } as unknown;
    const page_url = ['https://', process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN, 'brochure'].join('/');
    pdf = await getPdf(page_url, full_data as unknown);
  } else {
    console.log(searchParams, searchParams);
  }

  const dom = htmlToDOM(pdf);
  return domToReact(dom);
}
