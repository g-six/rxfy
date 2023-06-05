import axios from 'axios';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { mutation_create_meta, mutation_update_agent } from './graphql';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { AgentInput } from '@/_typings/agent';

export async function getSmart(
  agent: AgentInput & { id: number },
  property: { [key: string]: string | number },
  real_estate_board?: { id: number; name: string; abbreviation: string },
) {
  let prompt = `My name's ${agent.full_name} and I'm a licenced realtor for ${`${real_estate_board?.name ? `(${real_estate_board.name}) ` : ''}`}who sells ${
    property.property_type
  } homes, among many others.  For instance, I've recently listed a ${getShortPrice(Number(property.asking_price), '$')}, ${property.beds}-bedroom / ${
    property.baths
  }-baths located in ${property.target_city} from ${
    property.listing_date
  }.\n\nBased on that information, write me a short and precise realtor bio (JSON key "bio") from a first-person point of view for prospect clients belonging to the demographic looking for listings in the same city or area, a set of SEO metatags (JSON key "metatags") fit for my professional website and a well structured SEO friendly tagline  (JSON key "tagline").  Contain the results in JSON key-value pair format.`;
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
        temperature: 0.08,
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
