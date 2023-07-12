import { NextRequest } from 'next/server';
import { getResponse } from '../../response-helper';
import { sendTemplate } from '../../send-template';
import Mailchimp from '@mailchimp/mailchimp_transactional';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const {
    customer: { email, full_name },
    agent: {
      agent_id,
      domain_name,
      metatags: { logo_for_light_bg, logo_for_dark_bg, profile_slug },
      full_name: agent_name,
    },
    name: document_name,
  } = payload as {
    name: string;
    customer: { email: string; full_name: string };
    agent: { email: string; full_name: string; domain_name: string; agent_id: string; metatags: { [key: string]: string } };
  };
  const send_to: Mailchimp.MessageRecipient = {
    email,
    name: full_name,
  };
  let agent_logo = logo_for_light_bg || logo_for_dark_bg || '';

  if (agent_logo) agent_logo = getImageSized(agent_logo, 240);

  await sendTemplate('request-a-document', [send_to], {
    agent_logo,
    agent_name,
    document_name,
    upload_page_url: domain_name ? `https://${domain_name}/my-profile` : new URL(req.url).origin + `/${agent_id}/${profile_slug}/my-profile`,
  });

  return getResponse({
    email,
    full_name,
    logo_for_dark_bg,
    logo_for_light_bg,
    agent_name,
    document_name,
  });
}
