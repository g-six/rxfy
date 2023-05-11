import { retrieveBearer } from '@/_utilities/api-calls/token-extractor';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getUserById } from '../check-session/route';
import { encrypt } from '@/_utilities/encryption-helper';
import { getResponse } from '../response-helper';
import axios, { AxiosError } from 'axios';

const gql_by_email = `query Agent($email: String!) {
    agents(filters: { email: { eqi: $email } }) {
      data {
        id
        attributes {
          agent_id
          email
          phone
          first_name
          last_name
          full_name
          website_theme
          street_1
          street_2
          api_key
          agent_metatag {
            data {
              id
              attributes {
                title
                description
                personal_title
                listings_title
                personal_bio
                favicon
                logo_for_dark_bg
                logo_for_light_bg
                profile_image
                headshot
                instagram_url
                facebook_url
                linkedin_url
                twitter_url
                youtube_url
                mailchimp_subscription_url
                target_city
                search_highlights
                brokerage_name
                brokerage_id
                profile_slug
              }
            }
          }
          webflow_domain
        }
      }
    }
  }
`;

export async function GET(req: Request) {
  let session_key = '';
  let results = {
    error: 'Auth token required',
  };
  if (req.headers.get('authorization')) {
    try {
      const { token, guid } = getTokenAndGuidFromSessionKey(retrieveBearer(req.headers.get('authorization') as string));
      const {
        data: {
          customer: { data: record },
        },
      } = await getUserById(Number(guid));

      const user = {
        id: record.id,
        ...record.attributes,
      };

      if (user.last_activity_at) {
        // Only if user is logged in
        const compare = `${encrypt(user.last_activity_at)}.${encrypt(user.email)}`;
        const domain_name = req.headers.get('host')?.indexOf('localhost') !== 0 ? req.headers.get('host') : process.env.TEST_DOMAIN;
        if (compare === token) {
          return new Response(
            JSON.stringify(
              {
                session_key: `${encrypt(user.last_activity_at)}.${encrypt(user.email)}-${guid}`,
                customer: user,
                domain_name,
              },
              null,
              4,
            ),
            { headers: { 'Content-Type': 'application/json' } },
          );
        }
      }
    } catch (e) {}
  }

  return new Response(JSON.stringify(results, null, 4), { headers: { 'Content-Type': 'application/json' }, status: 401 });
}

export async function POST(req: Request) {
  let results = {
    error: 'Auth token required',
  };

  try {
    const { agent_id, email, phone, full_name, listing } = await req.json();

    if (agent_id && email && phone && full_name && listing) {
      const { data: response_data } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_by_email,
          variables: {
            email,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response_data?.data?.agents?.data?.length) {
        const { id: agent_record_id, attributes } = response_data.data.agents.data[0];
        return getResponse(
          {
            ...attributes,
            id: Number(agent_record_id),
          },
          200,
        );
      }
      const first_name = `${full_name}`.split(' ')[0];
      const last_name = `${full_name}`.split(' ').pop();
      const prompt = `Create a short bio for ${full_name}, a realtor who focuses on selling residential properties that has the attributes and the location of the property with a description, "${listing}."`;
      axios
        .post(
          `${process.env.NEXT_APP_OPENAI_URI}`,
          {
            prompt,
            max_tokens: 300,
            temperature: 0.3,
            model: 'text-davinci-003',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.NEXT_APP_OPENAI_API}`,
            },
          },
        )
        .then(({ data }) => {
          const {
            choices: [{ text: description }],
          } = data;
          console.log({ description });
        });
      return getResponse(
        {
          agent_id,
          email,
          phone,
          first_name,
          last_name,
        },
        200,
      );
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr);
    results.error = axerr.code as string;
  }

  return new Response(JSON.stringify(results, null, 4), { headers: { 'Content-Type': 'application/json' }, status: 401 });
}
