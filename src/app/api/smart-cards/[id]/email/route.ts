import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const card_id = Number(params.id);

  // sendTemplate(
  //     'new-card-order',
  //     send_to,
  //     {
  //       name: form?.name as string,
  //       customer_email: agent && agent.email,
  //       customer_name: form?.name as string,
  //       customer_phone: agent?.phone as string,
  //     },
  //     attachments,
  //   ).then(() => {
  //     updateCardsList('new', {
  //       id: Number(res.record.id),
  //       name: res.record.attributes.name,
  //       title: res.record.attributes.title,
  //       logo_url: res.record.attributes.logo_url,
  //     } as SmartCardResponse);
  //   });
}
