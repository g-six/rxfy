import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import axios, { AxiosError } from 'axios';
import { NextResponse } from 'next/server';
import { createAgentRecordIfNoneFound, findAgentRecordByAgentId } from '../agents/model';
import { AIGeneratedDetails, AgentData } from '@/_typings/agent';
import { encrypt } from '@/_utilities/encryption-helper';
import { sendTemplate } from '../send-template';
import { MessageRecipient } from '@mailchimp/mailchimp_transactional';
export const maxDuration = 300;
type StripeCustomField = 'fullname' | 'agentidparagonid';
interface StripeWebhookPayload {
  custom_fields: {
    key: StripeCustomField;
    text: {
      value: string;
    };
  }[];
  customer: string; // cus_XYZ123
  customer_details: {
    address: {
      country: string;
      postal_code: string;
    };
    email: string;
    phone: string;
  };
  subscription: string; // subscription id
  invoice: string; // invoice id
}

export async function POST(req: Request) {
  const payload: {
    data: {
      object: StripeWebhookPayload;
    };
  } = await req.json();

  if (payload.data.object.customer) {
    const { object } = payload.data;

    // Should have at least fullname and agentidparagonid
    if (object.custom_fields?.length > 1) {
      const [
        {
          text: { value: agent_id },
        },
      ] = object.custom_fields.filter(o => o.key === 'agentidparagonid');
      const [
        {
          text: { value: full_name },
        },
      ] = object.custom_fields.filter(o => o.key === 'fullname');
      if (agent_id && full_name) {
        let agent_record_id = 0;
        const agent: AgentData = await findAgentRecordByAgentId(agent_id);
        const { customer: stripe_customer, subscription: stripe_subscription, invoice, customer_details } = object;
        const { email, phone } = customer_details;
        let first_name = '',
          last_name = '';
        try {
          if (!agent || !agent.metatags) {
            const names = full_name.split(' ', 2);
            first_name = names[0];
            last_name = names[1];

            const { postal_code, country } = customer_details.address;
            const profile_slug = slugifyAddress(`la-${first_name}-${agent_id}-${phone.split('').reverse().slice(0, 4).reverse().join('')}`.toLowerCase());
            const swlng = -122.855371;
            const swlat = 49.016393;
            const nelng = -122.779167;
            const nelat = 49.031259;
            const lat = 49.023536;
            const lng = -122.797925;
            let prompt = `Create a realtor bio (JSON key "bio"), a set of SEO metatags (JSON key "metatags") fit for my professional website, website title (JSON key "title") a well structured, 
            3-worded, SEO friendly tagline (JSON key "tagline"), and my geo location information for Google maps. Contain the results in JSON key-value pair format like the two examples below.
            Realtor name: Mo B. Spencer PREC*
            Realtor postal code and country: L5C 1B7, CA
            JSON: { "bio": "As an experienced licenced real estate agent of the Toronto Regional Real Estate Board, Mo's team is a nationally recognized real estate company with more than 3,500 happy families represented we know how to connect buyers and sellers in Canada.", "metatags": "real estate, realtor, Mississauga, Mike Shinoda, home buy & sell, property search", "tagline": "Delivering exceptional results for home buyers within the Erindale neighbourhood and city of Mississauga, ON", "lat": 43.561464, "lng": -79.659626, "swlng": -79.89640890264923, "swlat": 43.4555573257108, "nelng": -79.43424268103404, "nelat": 43.677130546715375, "city": "Mississauga, ON" }
    
            Realtor name: Sue Andrews
            Realtor postal code and country: 95041, US
            JSON: { "bio": "Serving the Monterey Bay and SF Bay Area, our team specializes in property preparation and presentation. We put your needs ahead of our own and help you get top dollar for your home. Our commitment to you extends far beyond the close of escrow, and we pride ourselves on the long-standing relationships that we develop with our clients.", "metatags": "real estate, realtor, Santa Cruz California, Sue Andrews, home buy & sell, home search", "tagline": "Innovative Real Estate Company from Santa Cruz, US", "lat": 37.050694183527554, "lng": -122.056600751223, "nelat": ${nelat}, "nelng": ${nelng}, "swlat": ${swlat}, "swlng": ${swlng}, "city": "Santa Cruz, California" }
            
            Realtor name: Kate Bellingham
            Realtor postal code and country: V4A 5A3, CA
            JSON: {"bio": "Kate Bellingham is a licenced realtor serving the White Rock and South Surrey area of BC, Canada. With years of experience in the local real estate market, she's committed to helping clients find the perfect property to fit their needs.", "metatags": "real estate, realtor, South Surrey and White Rock, Tom Tsunoda, home buying, property search", "title": "Kate Bellingham | Real Estate Realtor in White Rock", "tagline": "Leading South Surrey & White Rock full service real estate agency", "lat": ${lat}, "lng": ${lng}, "nelat": ${nelat}, "nelng": ${nelng}, "swlat": ${swlat}, "swlng": ${swlng}, "city": "Surrey, BC"}
            
            Realtor name: ${full_name}
            Realtor postal code and country: ${postal_code}, ${country}
            JSON:`;
            const { data } = await axios.post(
              `${process.env.NEXT_APP_OPENAI_URI}`,
              {
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 400,
                temperature: 1,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                model: 'gpt-4',
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${process.env.NEXT_APP_OPENAI_API}`,
                },
              },
            );
            const { choices, error } = data;

            const text = (choices as unknown[] as { message: { role: string; content: string } }[])
              .filter(choice => choice.message.role === 'assistant')
              .map(choice => choice.message.content)
              .pop();
            if (text) {
              const { keywords } = JSON.parse(text) as unknown as {
                keywords: string[];
              };

              console.log({ error });

              const ai_results = JSON.parse(text.trim()) as unknown as AIGeneratedDetails;
              const {
                id: existing_record_id,
                agent_metatag: {
                  data: { id: metatag_record, attributes: metatags },
                },
              } = await createAgentRecordIfNoneFound({
                agent_id,
                email,
                phone,
                full_name,
                first_name,
                last_name,
                stripe_customer,
                stripe_subscription,
                ai_results,
              });
              agent_record_id = Number(existing_record_id);
            } else {
              agent_record_id = agent.id;
            }

            const password = email.substring(0, 5) + stripe_customer.split('_').pop()?.substring(0, 5);
            const encrypted_password = encrypt(password);
            const last_activity_at = new Date().toISOString();
            const new_realtor = {
              agent: agent_record_id,
              email,
              encrypted_password,
              full_name,
              first_name,
              last_name,
              stripe_customer,
              stripe_subscriptions: {
                [stripe_subscription]: {
                  invoice,
                },
              },
              phone_number: phone,
              is_verified: false,
              last_activity_at,
            };
            const { data: realtor } = await axios.post(
              `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
              {
                query: gql_create_realtor,
                variables: {
                  data: new_realtor,
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
                  'Content-Type': 'application/json',
                },
              },
            );

            console.log('realtor.data', JSON.stringify({ new_realtor, realtor_data: realtor.data }));

            const session_key = realtor.data?.createRealtor?.data?.id
              ? `${encrypt(last_activity_at)}.${encrypt(email)}-${realtor.data?.createRealtor?.data?.id}`
              : '';
            if (session_key) {
              const receipients: MessageRecipient[] = [
                {
                  email,
                  name: full_name,
                },
              ];

              const url = new URL(req.url);
              console.log('\nAttempt to email', {
                send_to_email: email,
                password,
                dashboard_url: `${url.origin}/my-profile?key=${session_key}`,
                from_name: 'Leagent Team',
                subject: 'Welcome aboard!',
              });

              await sendTemplate('welcome-agent', receipients, {
                send_to_email: email,
                password,
                dashboard_url: `${url.origin}/my-profile?key=${session_key}&as=realtor`,
                from_name: 'Leagent Team',
                subject: 'Welcome aboard!',
              });

              console.log('/n/nwelcome-agent template delivered');
              console.log('/nend');
            }
          }
        } catch (e) {
          const { response } = e as AxiosError;
          console.log('OpenAI error for prompt:');
          if (response?.data) console.log(JSON.stringify(response?.data, null, 4));
          else console.log(JSON.stringify(response, null, 4));
        }

        return NextResponse.json({
          agent_id,
          full_name,
          first_name,
          stripe_customer,
          stripe_subscription,
          email,
          phone,
        });
      }
    }
  }
}

const gql_create_realtor = `mutation SignUp ($data: RealtorInput!) {
    createRealtor(data: $data) {
      data {
        id
        attributes {
          email
          full_name
          last_activity_at
          is_verified
          agent {
            data {
              id
              attributes {
                full_name
                email
                phone
              }
            }
          }
        }
      }
    }
  }`;
