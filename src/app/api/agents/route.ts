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
import { AgentData } from '@/_typings/agent';

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
    const { user, stripe, agent_id } = payload;
    let { email, phone, full_name, listing, real_estate_board } = payload;
    if (user?.email) email = user.email;
    if (user?.phone) phone = user.phone;
    if (user?.full_name) full_name = user.full_name;

    if (agent_id && phone && full_name) {
      if (listing && real_estate_board) {
        results = {
          ...results,
          error: 'Unable to create agent record',
        };
        const agent = await createAgentRecordIfNoneFound(
          {
            agent_id,
            email,
            phone,
            full_name,
          },
          real_estate_board,
        );
        return getResponse(agent as any, 200);
      } else if (stripe?.customer_id) {
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
                { match: { 'data.LA3_Emxil': email } },
              ],
              minimum_should_match: 1,
            },
          },
        };
        const legacy_listings = await retrieveFromLegacyPipeline(legacy_params, undefined, 2);
        listing = legacy_listings.length && legacy_listings[0];
        if (listing.mls_data) {
          real_estate_board = await getRealEstateBoard(listing.mls_data as unknown as Record<string, string>);

          const agent = await createAgentRecordIfNoneFound(
            {
              agent_id,
              email,
              phone,
              full_name,
            },
            real_estate_board,
          );

          return getResponse(agent as any, 200);
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
