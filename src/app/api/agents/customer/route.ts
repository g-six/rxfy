import { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import MailChimp from '@mailchimp/mailchimp_transactional';
import { getResponse } from '@/app/api/response-helper';
import { getUserSessionData, isRealtorRequest } from '@/app/api/check-session/model';
import { createAgentCustomer, createCustomer, findCustomerByEmail } from '@/app/api/customers/model';
import { encrypt } from '@/_utilities/encryption-helper';
import { sendTemplate } from '../../send-template';
import { getAgentBaseUrl } from '../../_helpers/agent-helper';
import { AgentData } from '@/_typings/agent';

export async function POST(request: NextRequest) {
  try {
    const user_type = isRealtorRequest(request.url) ? 'realtor' : 'customer';
    const authorization = request.headers.get('authorization') || '';
    const r = await getUserSessionData(authorization, user_type);
    // const r = await checkSession(request, { config: { internal: 'yes' } });

    const user = r as { [key: string]: string } & { id?: number; customers: { email: string }[] };
    if (!user?.id)
      return getResponse(
        {
          error: 'Please log in to your realtor account',
        },
        401,
      );
    const { host, ...data } = await request.json();

    const last_activity_at = new Date().toISOString();
    const password = user.session_key.substring(12, 20);
    const already_customers = user.customers.filter(customer => customer.email === data.email);
    if (already_customers.length)
      return getResponse(
        {
          record: already_customers.pop(),
        },
        200,
      );

    const existing = await findCustomerByEmail(data.email);

    if (existing.id) {
      const agent_customer = await createAgentCustomer(user.agent as unknown as number, existing.id);
      console.log('agent_customer', agent_customer);
      if (agent_customer) return agent_customer;
      return getResponse(
        {
          error: 'This customer has already been previously added',
        },
        400,
      );
    }
    const customer = await createCustomer(
      {
        ...data,
        encrypted_password: encrypt(password),
        last_activity_at,
        yes_to_marketing: false,
      },
      user.agent as unknown as number,
    );

    const send_to: MailChimp.MessageRecipient[] = [
      {
        email: data.email,
        name: data.full_name,
      },
    ];

    if (customer && !customer.errors) {
      const { origin } = new URL(request.url);
      const metatags = user.metatags as unknown as { [key: string]: string };
      let login_url = user.domain_name
        ? `https://${user.domain_name}`
        : `https://${user.website_theme ? `${user.website_theme}-leagent` : 'app'}.leagent.com/${getAgentBaseUrl(user as unknown as AgentData)}`;
      login_url = `${login_url}/log-in?key=${encrypt(last_activity_at)}.${encrypt(data.email)}-${customer.id}`;
      sendTemplate('invite-buyer', send_to, {
        agent_logo:
          metatags.logo_for_light_bg ||
          metatags.logo_for_dark_bg ||
          'https://assets.website-files.com/643ca5bec96b4ead07ca5e3c/643f1ec844c663ef9d40a187_Leagent%20Logo.svg',
        agent_full_name: user.full_name,
        password,
        login_url,
      });
      return getResponse({
        customer,
        login_url,
      });
    } else {
      return getResponse(
        customer || {
          error: 'Unable to proceed with customer creation',
        },
        400,
      );
    }
  } catch (e) {
    const errors = e as AxiosError;
    const { message, response } = errors;
    console.log('API Error: agents.customer.POST', '\n', response?.data);
    console.error(errors);
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
