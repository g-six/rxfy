import { retrieveBearer } from '@/_utilities/api-calls/token-extractor';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getUserById } from '../check-session/route';
import { encrypt } from '@/_utilities/encryption-helper';

const gql_by_domain = `query Agent($domain_name: String!) {
    agents(filters: { domain_name: { eq: $domain_name } }) {
      data {
        id
        attributes {
          agent_id
          email
          phone
          first_name
          last_name
          full_name
          domain_name
          website_theme
          street_1
          street_2
          profile_id
          api_key
          agent_metatags {
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
    teams(filters: { domain_name: { eq: $domain_name } }) {
      data {
        attributes {
          agents {
            data {
              id
              attributes {
                agent_id
              }
            }
          }
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
