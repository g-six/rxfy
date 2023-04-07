import axios, { AxiosError } from 'axios';
import MailChimp from '@mailchimp/mailchimp_transactional';
import { encrypt } from '@/_utilities/encryption-helper';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gqlFindCustomer = `query FindCustomer($id: ID!) {
    customer(id: $id) {
      data {
        id
        attributes {
          email
          last_activity_at
        }
      }
    }
}`;

export async function POST(request: Request) {
  const authorization = await request.headers.get('authorization');
}

export async function sendTemplate(template_name: string, send_to: MailChimp.MessageRecipient[], payload: { [key: string]: string }, attachments = []) {
  const mailchimp = MailChimp(process.env.NEXT_APP_MANDRILL_API_KEY as string);
  const from_name = payload.from_name || 'Team Leagent';
  const reply_to = payload.reply_to || 'accounts@no-reply.leagent.com';
  const to: MailChimp.MessageRecipient[] = send_to;
  const merge_vars: MailChimp.RecipientMergeVar[] = send_to.map(({ email, name }: MailChimp.MessageRecipient) => {
    return {
      rcpt: `${name} <${email}>`,
      vars: Object.keys(payload).map((k: string) => {
        return {
          name: k,
          content: payload[k],
        };
      }),
    };
  });

  const message = {
    email: send_to[0].email,
    from_email: reply_to,
    from_name,
    to,
    headers: {
      'Reply-To': `${from_name || reply_to || reply_to} <${reply_to}>`,
    },
    attachments,
    merge_vars,
  };

  const xhr = await mailchimp.messages.sendTemplate({
    template_name,
    template_content: [],
    message,
  });

  if (xhr) {
    const { reject_reason } = xhr as unknown as { reject_reason: string };
    if (!reject_reason) {
      const mailchimp_response = xhr as MailChimp.MessagesSendResponse[];
      console.log(mailchimp_response.toString(), null, 4);
    } else {
      console.log({ reject_reason });
    }
  }
}
