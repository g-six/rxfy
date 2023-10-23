import axios, { AxiosError } from 'axios';
import { SearchHighlightInput } from '@/_typings/maps';
import { AgentMetatagsInput } from '@/_typings/agent';
import { slugifyAddress } from '@/_utilities/data-helpers/property-page';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { buildCacheFiles } from '@/app/api/properties/model';
import { getResponse } from '@/app/api/response-helper';
import { getRealEstateBoard } from '@/app/api/real-estate-boards/model';
import { createAgent, createAgentMetatag } from './model';
import { getSampleListings } from './utilities';
export const maxDuration = 300;
export async function POST(req: Request) {
  const payload = await req.json();
  let results = {
    api: 'POST /api/new-agent',
    payload,
    error: 'Auth token required',
  };

  try {
    const { agent_id, full_name, email, phone } = payload;
    const target_city = payload.target_city as SearchHighlightInput;
    if (agent_id && email && phone && full_name && target_city) {
      const { neighbourhoods } = (payload as unknown as {
        neighbourhoods: SearchHighlightInput[];
      }) || { neighbourhoods: [] };

      const search_highlights = [target_city]
        .concat(neighbourhoods.filter(n => n.name !== target_city.name))
        .map((location: SearchHighlightInput & { address?: string }) => {
          return {
            name: location.name,
            title: location.address || location.city || location.name,
            place_id: location.place_id,
            lat: location.lat,
            lng: location.lng,
            nelat: location.nelat,
            nelng: location.nelng,
            swlat: location.swlat,
            swlng: location.swlng,
            ne: {
              lat: location.nelat,
              lng: location.nelng,
            },
            sw: {
              lat: location.swlat,
              lng: location.swlng,
            },
          };
        });
      const results = {
        agent_id,
        search_highlights: {
          labels: search_highlights,
        },
        target_city: target_city.name,
        lat: target_city.lat,
        lng: target_city.lng,
        geocoding: target_city,
        listings_title: 'Recent Listings',
      };
      const [reb_data] = await Promise.all([getSampleListings(agent_id, target_city)]);

      const {
        hits: {
          hits: [
            {
              _source: {
                data: {
                  MLS_ID,
                  LA1_LoginName,
                  LA1_Email,
                  LA1_FullName,
                  LA2_LoginName,
                  LA2_Email,
                  LA2_FullName,
                  LA3_LoginName,
                  LA3_Email,
                  LA3_FullName,
                  L_ShortRegionCode,
                  OriginatingSystemName,
                  LA1_Board,
                  LA2_Board,
                  LA3_Board,
                  LA4_Board,
                  ListAgent1,
                  LO1_Brokerage,
                },
              },
            },
          ],
        },
      } = reb_data.data;

      let prompt = `My name's ${full_name} and I'm a `;

      const listing = await buildCacheFiles(MLS_ID);
      let real_estate_board = 0;
      if (listing) {
        const reb = await getRealEstateBoard({
          L_ShortRegionCode,
          OriginatingSystemName,
          LA1_Board,
          LA2_Board,
          LA3_Board,
          LA4_Board,
          ListAgent1,
          LO1_Brokerage,
        });
        if (reb?.id) {
          real_estate_board = Number(reb.id);
        }
        console.log(LA1_Email, LA1_FullName, LA2_Email, LA2_FullName, LA3_Email, LA3_FullName);
        prompt = `${prompt} licenced realtor off the ${listing.real_estate_board_name}`;
      } else {
        prompt = `${prompt} licenced realtor catering to the city of ${target_city.city}`;
      }

      prompt = `${prompt}, search for a recent real estate listing in the city of ${target_city.city} and based on that listing's location and surrounding places of interests, write me a realtor bio (JSON key "personal_bio") from a first-person point of view for prospect home buyers 
  belonging to the demographic looking for listings in the same city or area, a set of SEO keywords (JSON key "keywords") fit for my professional website, website title (JSON key "title"), website description meta tag (JSON key "description"), and a well structured, 
  3-worded, SEO friendly tagline (JSON key "personal_title").  Contain the results in JSON key-value pair format.
  `;

      const ai_xhr = await axios.post(
        `${process.env.NEXT_APP_OPENAI_URI}`,
        {
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 1,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          // model: 'text-davinci-003',
          model: 'gpt-4',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_APP_OPENAI_API}`,
          },
        },
      );
      const { data } = ai_xhr;
      const { choices, error } = data;
      console.log({ error });
      let agent_metatag: AgentMetatagsInput = {
        ...results,
        agent_id,
        target_city: target_city.name,
      };
      const text = (choices as unknown[] as { message: { role: string; content: string } }[])
        .filter(choice => choice.message.role === 'assistant')
        .map(choice => choice.message.content)
        .pop();
      if (text) {
        const { keywords } = JSON.parse(text) as unknown as {
          keywords: string[];
        };
        agent_metatag = {
          ...JSON.parse(text),
          ...agent_metatag,
          keywords: keywords ? keywords.join(', ') : '',
        };
      }

      let agent = await findAgentRecordByAgentId(agent_id);
      if (agent) {
        console.log('Existing agent record', { agent });
      } else {
        // return getResponse({ listing, real_estate_board });
        const metatags = await createAgentMetatag({
          ...agent_metatag,
          profile_slug: slugifyAddress(
            `la-${full_name.split(' ').reverse().pop()}-${agent_id}-${phone.split('').reverse().slice(0, 4).reverse().join('')}`.toLowerCase(),
          ),
        });
        if (metatags?.id) {
          const agent = await createAgent({
            agent_id,
            email,
            full_name,
            phone,
            agent_metatag: metatags.id,
            street_1: target_city.address || target_city.name,
            real_estate_board: real_estate_board || undefined,
          });

          return getResponse(agent);
        }
      }
      return getResponse(agent_metatag, 400);
    } else {
      const missing: string[] = [];
      if (!agent_id) missing.push('Agent ID (Paragon)');
      if (!full_name) missing.push('full name');
      if (!email) missing.push('email');
      if (!phone) missing.push('phone number');
      return getResponse(
        {
          ...payload,
          error: `Sorry, we need your ${
            missing.length < 3 ? missing.join(' and ') : missing.map((field, idx) => (idx >= missing.length ? `and ${field}` : field)).join(', ')
          }`,
        },
        400,
      );
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log('ERROR in new-agent.POST', axerr.response?.data);
    results.error = axerr.code as string;
  }

  return new Response(JSON.stringify(results, null, 4), { headers: { 'Content-Type': 'application/json' }, status: 401 });
}
