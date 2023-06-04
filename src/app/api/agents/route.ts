import { retrieveBearer } from '@/_utilities/api-calls/token-extractor';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getUserById } from '../check-session/route';
import { encrypt } from '@/_utilities/encryption-helper';
import { getResponse } from '../response-helper';
import { AxiosError } from 'axios';
import { createAgentRecordIfNoneFound } from './model';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { getRealEstateBoard } from '../real-estate-boards/model';

export async function GET(req: Request) {
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
  const payload = await req.json();
  let results = {
    api: 'POST /api/agents',
    payload,
    error: 'Auth token required',
  };

  try {
    // TODO: listing refactor
    const { agent_id, email, phone, full_name } = payload;
    let { listing, real_estate_board } = payload;
    const { customer_id, first_name, last_name } = payload; // Stripe webhook

    if (agent_id && email && phone && full_name) {
      if (listing && real_estate_board) {
        const agent = await createAgentRecordIfNoneFound(
          {
            agent_id,
            email,
            phone,
            full_name,
          },
          real_estate_board,
          listing,
        );
        return getResponse(agent, 200);
      } else if (customer_id && first_name && last_name) {
        // From Stripe signups
        const legacy_params: LegacySearchPayload = {
          from: 0,
          size: 3,
          query: {
            bool: {
              should: [
                { match: { 'data.LA1_LoginName': agent_id } },
                { match: { 'data.LA2_LoginName': agent_id } },
                { match: { 'data.LA3_LoginName': agent_id } },
                { match: { 'data.LA1_Email': email } },
                { match: { 'data.LA2_Email': email } },
                { match: { 'data.LA3_Email': email } },
              ],
              minimum_should_match: 1,
            },
          },
        };
        const legacy_listings = await retrieveFromLegacyPipeline(legacy_params, undefined, 1);
        listing = legacy_listings.length && legacy_listings[0];
        if (listing) {
          const {
            description,
            lat,
            lng,
            area: target_area,
            city: target_city,
            asking_price,
            property_type,
            beds,
            baths,
            listed_at: listing_date,
            ...mls_data
          } = listing;
          real_estate_board = await getRealEstateBoard(mls_data as unknown as Record<string, string>);

          const agent = await createAgentRecordIfNoneFound(
            {
              agent_id,
              email,
              phone,
              full_name,
            },
            real_estate_board,
            {
              description,
              lat: Number(lat),
              lng: Number(lng),
              target_area,
              target_city,
              asking_price,
              property_type,
              beds,
              baths,
              listing_date,
            },
          );
          return getResponse(agent, 200);
        }
      }
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr);
    results.error = axerr.code as string;
  }

  return new Response(JSON.stringify(results, null, 4), { headers: { 'Content-Type': 'application/json' }, status: 401 });
}
