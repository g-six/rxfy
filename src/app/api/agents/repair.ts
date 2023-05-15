import axios from 'axios';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { gql_by_email, mutation_create_meta, mutation_update_agent } from './graphql';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { createAgent } from './model';
import { AgentData, AgentInput } from '@/_typings/agent';
import { RealEstateBoardDataModel } from '@/_typings/real-estate-board';

export async function createAgentRecordIfNoneFound(
  { agent_id, email, phone, full_name }: AgentInput,
  real_estate_board?: RealEstateBoardDataModel,
  listing?: {
    description: string;
    lat: number;
    lng: number;
    target_area: string;
    target_city: string;
    asking_price: number;
    property_type: string;
    beds: number;
    baths: number;
    listing_date: string;
  },
) {
  if (!email) return;
  if (!agent_id) return;
  if (!phone) return;
  if (!full_name) return;

  try {
    const variables = { email };
    const { data: response_data } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_by_email,
        variables,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const first_name = `${full_name}`.split(' ')[0];
    const last_name = `${full_name}`.split(' ').slice(0, 2).pop();

    let [agent] = response_data?.data?.agents?.data;
    if (!agent) {
      console.log("Agent not found, let's create it");
      const create_this = {
        agent_id,
        full_name,
        first_name,
        last_name,
        phone,
        email,
        real_estate_board_id: real_estate_board?.id || undefined,
      };
      const t = new Date();
      console.log('timestamp', t.toISOString());
      console.log(create_this);
      agent = await createAgent(create_this);
      console.log('');
      console.log('took', [Date.now() - t.getTime(), 'ms'].join(''));
      console.log('---');
    } else {
      console.log("Agent found, let's use it");
    }
    if (!agent.attributes.agent_metatag?.data?.attributes?.personal_bio && listing?.description) {
      console.log('No agent bio, sprucing it up...');
      console.log(agent);
      const agent_attributes: AgentInput & { id: number } & { [key: string]: string | number } = {
        id: Number(agent.id),
        ...agent.attributes,
      };

      Object.keys(agent_attributes).forEach(k => {
        if (agent_attributes[k] === null) delete agent_attributes[k];
      });

      getSmart(agent_attributes, listing, real_estate_board);
    }
    return agent;
  } catch (e) {
    console.log('Caught error in createAgentRecordIfNoneFound');
    console.error(e);
  }
}

async function getSmart(
  agent: AgentInput & { id: number },
  property: { [key: string]: string | number },
  real_estate_board?: { id: number; name: string; abbreviation: string },
) {
  let prompt = `My name's ${agent.full_name} and I'm a licenced realtor ${`${real_estate_board?.name ? `(${real_estate_board.name}) ` : ''}`}who sells ${
    property.property_type
  } homes.  For instance, I've recently listed a ${getShortPrice(Number(property.asking_price), '$')}, ${property.beds}-bedroom / ${
    property.baths
  }-baths located in ${property.target_city} from ${
    property.listing_date
  }.\n\n Based on that information, write me a good realtor bio from a first-person point of view for prospect clients belonging to the demographic looking for listings in the same city or area.`;
  console.log('---');
  console.log('Processing:');
  console.log(prompt);
  console.log('---');
  axios
    .post(
      `${process.env.NEXT_APP_OPENAI_URI}`,
      {
        prompt,
        max_tokens: 400,
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
      const personal_bio = text.trim();

      if (personal_bio) {
        const personal_title = personal_bio.trim().split('. ')[0];
        const description = [personal_bio.trim().split('. ').slice(1, 3).join('. '), '.'].join('');

        const { target_city, lat, lng } = property;
        const metatag = {
          agent_id: agent.agent_id,
          target_city,
          lat,
          lng,
          title: agent.full_name,
          personal_title,
          personal_bio,
          description,
          profile_slug: [
            `${real_estate_board?.abbreviation || 'la'}`,
            slugifyAddress(agent.full_name).split('-')[0],
            `${`${agent.phone}`.split('').reverse().join('').substring(0, 4).split('').reverse().join('')}`,
          ].join('-'),
        };
        console.log({ metatag });
        axios
          .post(
            `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
            {
              query: mutation_create_meta,
              variables: {
                data: metatag,
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

            // return {
            //   ...attributes,
            //   first_name,
            //   last_name,
            //   id: Number(agent_record_id),
            //   real_estate_board,
            // };
            console.log('Link agent record', agent.id, 'to metadata', { agent_metatag });
            axios
              .post(
                `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
                {
                  query: mutation_update_agent,
                  variables: {
                    id: Number(agent.id),
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
          })
          .catch(e => {
            console.log('OpenAI error for prompt:');
            console.log(prompt);
            console.log(e);
          });
      }
    })
    .catch(e => {
      console.log('OpenAI error for prompt:');
      console.log(prompt);
      console.log(e);
    });
}
