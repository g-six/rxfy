import { sendTemplate } from '@/app/api/send-template';
import { getResponse } from '../../response-helper';
import Mailchimp from '@mailchimp/mailchimp_transactional';

export async function POST(req: Request) {
  const { send_to, ...payload } = await req.json();
  sendTemplate('request-info', [send_to] as Mailchimp.MessageRecipient[], payload);
  return getResponse(payload);
}
