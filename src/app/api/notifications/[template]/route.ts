import { NextRequest, NextResponse } from 'next/server';
import { sendTemplate } from '../../send-template';
import { MessageRecipient } from '@mailchimp/mailchimp_transactional';
import { headers } from 'next/headers';

export async function POST(request: NextRequest, { params }: { params: { template: string } }) {
  const payload = await request.json();
  const auth = headers().get('Authorization');
  if (params.template && payload.message) {
    const receipient: MessageRecipient = {
      email: 'it@setsail.ca',
      name: 'Leagent Bugs',
    };
    await sendTemplate(params.template, [receipient], {
      message: payload.message,
    });

    return NextResponse.json({ message: 'Notification sent!', payload, params, auth });
  }
  return NextResponse.json({ payload, params, auth });
}
