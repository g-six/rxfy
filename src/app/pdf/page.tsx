import React from 'react';
import { getPdf } from '@/app/api/_helpers/pdf-helper';
import { getPropertyByMlsId } from '@/app/api/properties/model';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';

export default async function PdfPage({ searchParams }: any) {
  if (searchParams.agent && searchParams.slug && searchParams.mls) {
    const agent = await findAgentRecordByAgentId(searchParams.agent as string);
    const data = await getPropertyByMlsId(searchParams.mls as string);

    const full_data = {
      ...data,
      agent,
    } as unknown;
    const page_url = ['https://', process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN, 'brochure'].join('/');
    const buff = await getPdf(page_url, full_data as unknown);
    const blob = new Blob([buff], { type: 'application/pdf' });
    return <>{blob}</>;
  } else {
    console.log(searchParams, searchParams);
  }

  return <></>;
}
