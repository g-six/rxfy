import { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import MailChimp from '@mailchimp/mailchimp_transactional';
import { getResponse } from '@/app/api/response-helper';
import { GET as checkSession } from '@/app/api/check-session/route';
import { createCustomer } from '@/app/api/customers/model';
import { encrypt } from '@/_utilities/encryption-helper';
import { sendTemplate } from '../../send-template';

export async function POST(request: NextRequest) {
  try {
    const user = await checkSession(request);
    if (!user?.id)
      return getResponse(
        {
          error: 'Please log in to your realtor account',
        },
        401,
      );
    const data = await request.json();

    const last_activity_at = new Date().toISOString();
    const password = user.session_key.substring(12, 20);
    const customer = await createCustomer(
      {
        ...data,
        encrypted_password: encrypt(password),
        last_activity_at,
        yes_to_marketing: false,
      },
      user.agent,
    );

    const send_to: MailChimp.MessageRecipient[] = [
      {
        email: data.email,
        name: data.full_name,
      },
    ];
    const { origin } = new URL(request.url);
    let login_url = user.domain_name ? `https://${user.domain_name}` : `${origin}/${user.agent_id}/${user.metatags.profile_slug}`;
    login_url = `${login_url}/log-in?key=${encrypt(last_activity_at)}.${encrypt(data.email)}-${customer.id}`;
    sendTemplate('invite-buyer', send_to, {
      agent_logo:
        user.metatags.logo_for_light_bg ||
        user.metatags.logo_for_dask_bg ||
        'https://assets.website-files.com/643ca5bec96b4ead07ca5e3c/643f1ec844c663ef9d40a187_Leagent%20Logo.svg',
      agent_full_name: user.full_name,
      password,
      login_url,
    });

    if (customer) {
      return getResponse({
        customer,
        login_url,
      });
    }
  } catch (e) {
    const errors = e as AxiosError;
    const { message, response } = errors;
    console.log('API Error: agents.customer.POST');
    console.log(response?.data);
    return getResponse(
      {
        error: message,
      },
      400,
    );
  }

  return getResponse(
    {
      error: 'Cannot create customer',
    },
    401,
  );
}
