import Mailchimp from '@mailchimp/mailchimp_transactional';
import { sendTemplate } from '../../send-template';
import { getResponse } from '../../response-helper';

export async function POST(req: Request) {
  const { send_to, customer_name: from_name, message, phone } = await req.json();
  await sendTemplate('send-message', [send_to] as Mailchimp.MessageRecipient[], {
    from_name,
    message,
    phone,
  });

  return getResponse({ success: `${message} sent` });
}
