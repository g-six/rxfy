import MailChimp from '@mailchimp/mailchimp_transactional';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
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

export async function sendTemplate(template_name: string, send_to: MailChimp.MessageRecipient[], payload: { [key: string]: string }, attachments: any[] = []) {
  const mailchimp = MailChimp(process.env.NEXT_APP_MANDRILL_API_KEY as string);
  const from_name = payload.from_name || 'Team Leagent';
  const reply_to = payload.reply_to || 'accounts@no-reply.leagent.com';
  const to: MailChimp.MessageRecipient[] = send_to;
  const merge_vars: MailChimp.RecipientMergeVar[] = send_to.map(({ email, name }: MailChimp.MessageRecipient) => {
    return {
      rcpt: email,
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
      const [mailchimp_response] = xhr as MailChimp.MessagesSendResponse[];
    } else {
      console.log({ reject_reason });
    }
  }
}
