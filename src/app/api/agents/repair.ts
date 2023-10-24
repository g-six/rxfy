import axios from 'axios';
import { mutation_create_meta, mutation_update_agent } from './graphql';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { AgentInput } from '@/_typings/agent';
import { SearchHighlightInput } from '@/_typings/maps';

export const maxDuration = 300;

export async function getSmart(
  agent: AgentInput & { id: number; search_highlights?: SearchHighlightInput[] },
  property: { [key: string]: string | number },
  real_estate_board?: { id: number; name: string; abbreviation: string },
) {
  let prompt = `My name's ${agent.full_name} and I'm a licenced realtor catering to the city of ${property.city}`;

  if (real_estate_board) {
    prompt = `Retrieve the public information of a realtor named ${agent.full_name}, a licenced realtor for ${`${
      real_estate_board?.name ? `(${real_estate_board.name})` : property.city
    } `} with Paragon ID "${agent.agent_id}" from the internet and only use the most recently published source or article anytime from November ${
      new Date().getFullYear() - 1
    } to today. Based on that factual information`;
  }

  prompt = `${prompt}, write me a realtor bio (JSON key "bio") from a first-person point of view for prospect clients 
  belonging to the demographic looking for listings in the same city or area, 
  a set of SEO metatags (JSON key "metatags") fit for my professional website, website title (JSON key "title") and a well structured, 
  3-worded, SEO friendly tagline  (JSON key "tagline").  Contain the results in JSON key-value pair format.
  `;
  console.log('---');
  console.log('Processing:');
  console.log(`curl ${process.env.NEXT_APP_OPENAI_URI} -H 'content-type: application/json' -H 'Authorization: Bearer ${process.env.NEXT_APP_OPENAI_API}' \\`);

  console.log('---');
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
  try {
    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log(JSON.stringify(data, null, 4));
    console.log('');
    console.log('');
    console.log('');
    console.log('');
    const { choices, error } = data;

    const text = (choices as unknown[] as { message: { role: string; content: string } }[])
      .filter(choice => choice.message.role === 'assistant')
      .map(choice => choice.message.content)
      .pop();

    if (text) {
      const ai_results = JSON.parse(text.trim());

      if (ai_results.bio) {
        const { city: target_city, lat, lng } = property;
        const { NEXT_APP_MAPBOX_TOKEN } = process.env;
        const map_response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${NEXT_APP_MAPBOX_TOKEN}`);
        const data = await map_response.json();
        const { features } = data;
        let bounds: number[] = [];
        let geocoding: { [k: string]: any } = {};
        if (features) {
          features.forEach((feature: { context: { text: string; id: string }[]; bbox: number[]; place_type: string[] }) => {
            const { bbox, place_type, context } = feature;
            if (bounds && bounds.length === 0) {
              context.forEach(c => {
                if (c.id.includes('postcode')) {
                  geocoding = {
                    ...geocoding,
                    postal_zip_code: c.text,
                  };
                }
                if (c.id.includes('place')) {
                  geocoding = {
                    ...geocoding,
                    city: c.text,
                    name: c.text,
                    title: c.text,
                  };
                }
                if (c.id.includes('region')) {
                  geocoding = {
                    ...geocoding,
                    state_province: c.text,
                  };
                }
              });

              bounds = bbox;
            }
            if (place_type.includes('neighborhood')) {
              context.forEach(c => {
                if (c.id.includes('postcode')) {
                  geocoding = {
                    ...geocoding,
                    postal_zip_code: c.text,
                  };
                }
                if (c.id.includes('place')) {
                  geocoding = {
                    ...geocoding,
                    city: c.text,
                    name: c.text,
                    title: c.text,
                  };
                }
                if (c.id.includes('region')) {
                  geocoding = {
                    ...geocoding,
                    state_province: c.text,
                  };
                }
              });
              bounds = bbox;
            }
          });
        }

        const metatag = {
          agent_id: agent.agent_id,
          target_city,
          lat,
          lng,
          title: agent.full_name,
          personal_title: ai_results.tagline,
          personal_bio: ai_results.bio,
          description: ai_results.metatags,
          search_highlights: agent.search_highlights || [],
          geocoding:
            bounds.length === 4
              ? {
                  ...geocoding,
                  swlng: bounds[0],
                  swlat: bounds[1],
                  nelng: bounds[2],
                  nelat: bounds[3],
                }
              : {},
          profile_slug: [
            `${real_estate_board?.abbreviation || 'la'}`,
            slugifyAddress(agent.full_name).split('-')[0],
            agent.id,
            `${`${agent.phone || target_city || agent.agent_id}`.split('').reverse().join('').substring(0, 4).split('').reverse().join('')}`,
          ].join('-'),
        };

        console.log('[BEGIN] mutation_create_meta');
        console.log(JSON.stringify({ metatag }, null, 4));
        const created_metatag = await axios.post(
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
        );
        console.log('...[DONE] mutation_create_meta');

        const agent_metatag = Number(created_metatag.data?.data?.createAgentMetatag?.data.id);
        console.log('Link agent record', agent.id, 'to metadata', { agent_metatag });
        const prom = axios.post(
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
        );
        if (!real_estate_board) {
          return prom;
        } else {
          prom.then(res => {
            console.log('...[DONE] mutation_update_agent\n\n', res.data?.data?.updateAgent);
          });
        }
      }
    }
  } catch (e) {
    console.log('OpenAI error for prompt:');
    console.log(prompt);
    console.log(e);
  }
}
