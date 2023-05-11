import { retrieveBearer } from '@/_utilities/api-calls/token-extractor';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getUserById } from '../check-session/route';
import { encrypt } from '@/_utilities/encryption-helper';
import { getResponse } from '../response-helper';
import axios, { AxiosError } from 'axios';
const GQ_FRAG_AGENT_METATAG = `
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
`;
const GQ_FRAG_AGENT = `
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
            data {${GQ_FRAG_AGENT_METATAG}}
          }
          real_estate_board {
            data {
              id
            }
          }
        }
`;

const mutation_update_agent = `mutation UpdateAgent($id: ID!, $data: AgentInput!) {
  updateAgent(id: $id, data: $data) {
    data {${GQ_FRAG_AGENT}}
  }
}`;
const mutation_create_meta = `mutation CreateMeta($data: AgentMetatagInput!) {
  createAgentMetatag(data: $data) {
    data {${GQ_FRAG_AGENT_METATAG}}
  }
}`;

const gql_by_email = `query Agent($email: String!) {
  agents(filters: { email: { eqi: $email } }) {
    data {${GQ_FRAG_AGENT}}
  }
}`;

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

export async function createAgentRecordIfNoneFound({
  agent_id,
  email,
  phone,
  full_name,
  listing,
  real_estate_board,
  lat,
  lng,
  target_city,
}: {
  [key: string]: string | number;
}) {
  if (!email) return;
  if (!agent_id) return;
  if (!phone) return;
  if (!full_name) return;

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

  const first_name = `${full_name}`.split(' ')[0];
  const last_name = `${full_name}`.split(' ').pop();
  if (response_data?.data?.agents?.data?.length) {
    const { id: agent_record_id, attributes } = response_data.data.agents.data[0];

    if (!attributes.real_estate_board?.data && real_estate_board) {
      console.log('No real estate board linked to this agent, attempt to repair...');
      axios
        .post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: mutation_update_agent,
            variables: {
              id: agent_record_id,
              data: {
                real_estate_board,
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .then(res => {
          console.log(res.data?.data?.updateAgent);
          console.log('...[DONE] No real estate board linked to this agent, attempt to repair');
        });
    }

    if (!attributes.agent_metatag?.data?.attributes?.personal_bio && listing) {
      console.log('No agent bio, sprucing it up...');
      console.log(attributes);
      let prompt = `Can you get a bio of a realtor named ${full_name} based in ${target_city} from the open web?`;
      axios
        .post(
          `${process.env.NEXT_APP_OPENAI_URI}`,
          {
            prompt,
            max_tokens: 300,
            temperature: 0.2,
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
            choices: [{ text }],
          } = data;
          let ai_generated_description = text;

          prompt = `Create a short bio for ${full_name}, a realtor who focuses on selling residential properties that has the attributes and the location of the property with a description, "${listing}."`;

          const personal_bio = ai_generated_description.trim();
          let description = [ai_generated_description.trim().split('. ').slice(0, 2).join('. '), '.'].join('');
          let personal_title = ai_generated_description.trim().split('. ')[0];
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
                choices: [{ text: description_long }],
              } = data;
              if (description_long) {
                personal_title = description_long.trim().split('. ')[0];
                description = [description_long.trim().split('. ').slice(0, 2).join('. '), '.'].join('');
                axios
                  .post(
                    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
                    {
                      query: mutation_create_meta,
                      variables: {
                        data: {
                          agent_id,
                          description,
                          personal_title,
                          personal_bio,
                          title: full_name,
                          lat: lat || undefined,
                          lng: lng || undefined,
                          target_city: target_city || '',
                        },
                      },
                    },
                    {
                      headers: {
                        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
                        'Content-Type': 'application/json',
                      },
                    },
                  )
                  .then(res => {
                    const agent_metatag = Number(res.data?.data?.createAgentMetatag?.data.id);
                    console.log({ agent_metatag });

                    axios
                      .post(
                        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
                        {
                          query: mutation_update_agent,
                          variables: {
                            id: agent_record_id,
                            data: {
                              agent_metatag,
                            },
                          },
                        },
                        {
                          headers: {
                            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
                            'Content-Type': 'application/json',
                          },
                        },
                      )
                      .then(res => {
                        console.log(res.data?.data?.updateAgent);
                        console.log('...[DONE] mutation_create_meta');
                      });
                  });
              }
            });
        });
    }

    return {
      ...attributes,
      first_name,
      last_name,
      id: Number(agent_record_id),
      real_estate_board,
    };
  }
}

export async function POST(req: Request) {
  let results = {
    error: 'Auth token required',
  };

  try {
    const { agent_id, email, phone, full_name, listing } = await req.json();

    if (agent_id && email && phone && full_name && listing) {
      const agent = await createAgentRecordIfNoneFound({
        agent_id,
        email,
        phone,
        full_name,
      });

      return getResponse(agent, 200);
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr);
    results.error = axerr.code as string;
  }

  return new Response(JSON.stringify(results, null, 4), { headers: { 'Content-Type': 'application/json' }, status: 401 });
}
