import axios from 'axios';
import { mutation_create_meta, mutation_update_agent } from './graphql';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { AgentInput } from '@/_typings/agent';
import { SearchHighlightInput } from '@/_typings/maps';
import { consoler } from '@/_helpers/consoler';

const FILE = 'api/agents/repair.ts';
export const maxDuration = 300;
export async function getSmart(
  agent: AgentInput & { id: number; search_highlights?: SearchHighlightInput[] },
  property: { [key: string]: string | number },
  real_estate_board?: { id: number; name: string; abbreviation: string },
) {
  if (!property.city) {
    consoler(FILE, 'getSmart skipped');
    return { error: 'Invalid property', property };
  }
  let prompt = `My name's ${agent.full_name} and I'm a licenced realtor catering to the city of ${property.city}${
    property.city && property.state_province ? ', ' : ''
  }${property.state_province || ''}`;

  if (property.description) {
    prompt = `\nI've also recently listed a real estate property at ${property.title} with the following advertisement:\n\n"${property.description}"\n. With that taken into consideration`;
  }

  prompt = `${prompt}, write me a 200-worded realtor bio (JSON key "bio") from a first-person point of view for prospect clients 
  belonging to the demographic looking for listings in the same city or area, 
  a set of SEO metatags (JSON key "metatags") fit for my professional website, website title (JSON key "title") and a well structured, 
  3-worded, and SEO friendly tagline (JSON key "tagline"). Contain the results in JSON key-value pair format.
  `;
  consoler(FILE, { prompt });
  console.log('---');
  console.log('Processing:');
  console.log(`curl ${process.env.NEXT_APP_OPENAI_URI} -H 'content-type: application/json' -H 'Authorization: Bearer ${process.env.NEXT_APP_OPENAI_API}' \\`);

  console.log('---');
  const { data } = await axios.post(
    `${process.env.NEXT_APP_OPENAI_URI}`,
    {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
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
    const { choices, error } = data;

    const text = (choices as unknown[] as { message: { role: string; content: string } }[])
      .filter(choice => choice.message.role === 'assistant')
      .map(choice => choice.message.content.split('"\n\n  "').join('",\n\n  "'))
      .pop();

    if (text) {
      const ai_results = JSON.parse(text.trim());

      if (ai_results.bio) {
        let search_highlights: unknown[] = [];
        const { city: target_city, lat } = property;
        const lng = property.lng || property.lon;
        const { NEXT_APP_MAPBOX_TOKEN } = process.env;
        let geocoding: { [k: string]: any } = {};

        const mapbox_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(target_city)}.json?${
          lat && lng ? `proximity=${lng},${lat}&` : ''
        }access_token=${NEXT_APP_MAPBOX_TOKEN}`;

        const map_response = await fetch(mapbox_url);
        const data = await map_response.json();
        const { features } = data;
        let bounds: number[] = [];
        if (features) {
          features.forEach((feature: { context: { text: string; id: string }[]; bbox: number[]; place_type: string[] }) => {
            const { bbox, place_type, context } = feature;
            if (bounds && bounds.length === 0) {
              context.forEach(c => {
                if (bounds && bounds.length === 0 && bbox && bbox.length >= 0) {
                  bounds = bbox;
                }
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
            }

            if (place_type.includes('address')) {
              context
                .filter(c => c.id.includes('address.'))
                .forEach(c => {
                  search_highlights.push({
                    labels: {
                      title: c.text,
                      name: c.text,
                      city: c.text,
                      zoom: 11,
                    },
                  });
                });
            }
          });
        }
        if (bounds && bounds.length === 4) {
          geocoding = {
            ...geocoding,
            swlng: bounds[0] - 0.0009,
            swlat: bounds[1] - 0.0006,
            nelng: bounds[2] + 0.0009,
            nelat: bounds[3] + 0.0006,
          };
          search_highlights = search_highlights.map(h => ({
            ...(h as any),
            ne: {
              lng: bounds[2],
              lat: bounds[3],
            },
            sw: {
              lng: bounds[0],
              lat: bounds[1],
            },
          }));
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
          search_highlights: JSON.stringify(agent.search_highlights || search_highlights || []),
          geocoding: JSON.stringify(geocoding, null, 4),
          profile_slug: [
            `${real_estate_board?.abbreviation || 'la'}`,
            slugifyAddress(agent.full_name).split('-')[0],
            agent.id,
            `${`${agent.phone || target_city || agent.agent_id}`.split('').reverse().join('').substring(0, 4).split('').reverse().join('')}`,
          ].join('-'),
        };
        if (search_highlights.length === 0 && geocoding.nelat) {
          metatag.search_highlights = JSON.stringify([
            {
              labels: {
                ...geocoding,
                title: target_city,
                name: target_city,
                lat: metatag.lat,
                lng: metatag.lng,
              },
            },
          ]);
        }

        console.log('');
        console.log('');
        console.log('/api/agents/repair.getSmart');
        console.log('[BEGIN] mutation_create_meta');
        console.log(JSON.stringify(metatag, null, 4));
        console.log('');
        console.log('');
        console.log('');
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
            if (res.data?.data?.updateAgent.data?.attributes?.agent_metatag?.data?.attributes) {
              console.log('metatags ', JSON.stringify(res.data?.data?.updateAgent.data.attributes.agent_metatag.data.attributes, null, 4));
            }
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
