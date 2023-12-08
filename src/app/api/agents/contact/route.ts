import Mailchimp from '@mailchimp/mailchimp_transactional';
import { sendTemplate } from '@/app/api/send-template';
import { getResponse } from '@/app/api/response-helper';
import { createCustomer } from '@/app/api/customers/model';
import { findRealtorBy } from '../../realtors/model';
import { consoler } from '@/_helpers/consoler';
import { encrypt } from '@/_utilities/encryption-helper';
import { NextResponse } from 'next/server';
const FILE = 'agents/contact/route.ts';
export async function POST(req: Request) {
  const { send_to, customer_name: from_name, email, message, phone, host } = await req.json();
  await sendTemplate('send-message', [send_to] as Mailchimp.MessageRecipient[], {
    from_name,
    message,
    phone,
    reply_to: email || 'team+reply-to-customer@leagent.com',
  });
  if (email) {
    const filters = {
      email: {
        eqi: send_to.email,
      },
    };
    const gql_results = await findRealtorBy(filters);
    const {
      data: {
        realtors: { data: realtors },
      },
    } = gql_results as {
      data: {
        realtors: {
          data: {
            id: string;
            attributes: {
              agent: {
                data: {
                  id: string;
                  attributes: {
                    agent_id: string;
                    domain_name: string;
                    full_name: string;
                    agent_metatag: {
                      data: {
                        attributes: {
                          logo_for_light_bg: string;
                          logo_for_dark_bg: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          }[];
        };
      };
    };
    if (realtors?.length) {
      try {
        const [realtor] = realtors.map(r => {
          return {
            id: Number(r.id),
            agent: {
              ...r.attributes.agent.data.attributes,
              metatags: r.attributes.agent.data.attributes.agent_metatag.data.attributes,
              id: Number(r.attributes.agent.data.id),
            },
          };
        });

        if (realtor) {
          const last_activity_at = new Date().toISOString();
          const password = `${from_name.split(' ').pop()}-${realtor.agent.id}-${Date.now().toString().split('').reverse().slice(0, 3).join('')}`;
          const customer = await createCustomer(
            {
              email,
              phone_number: phone || '',
              full_name: from_name,
              encrypted_password: encrypt(password),
              yes_to_marketing: false,
              last_activity_at,
            },
            realtor.agent.id,
          );

          if (customer.id) {
            const { origin, pathname } = new URL(req.url);
            let login_url = `${host || origin}${realtor.agent.domain_name ? '' : `/${realtor.agent.agent_id}`}`;
            login_url = `${login_url}/log-in?key=${encrypt(last_activity_at)}.${encrypt(email)}-${customer.id}&as=customer`;
            sendTemplate(
              'invite-buyer',
              [
                {
                  email,
                  name: from_name,
                },
              ],
              {
                agent_logo:
                  realtor.agent.metatags.logo_for_light_bg ||
                  realtor.agent.metatags.logo_for_dark_bg ||
                  'https://assets.website-files.com/643ca5bec96b4ead07ca5e3c/643f1ec844c663ef9d40a187_Leagent%20Logo.svg',
                agent_full_name: realtor.agent.full_name,
                password,
                login_url,
              },
            );
            return getResponse({
              customer,
              login_url,
            });
          }

          return NextResponse.json({
            message: 'Skipped creating customer record',
          });
        }
      } catch (e) {
        consoler(FILE, 'Unable to process lead via contact', e);
      }
    }
    // await createCustomer(customer, agent)
  }

  return getResponse({ success: `${message} sent` });
}
