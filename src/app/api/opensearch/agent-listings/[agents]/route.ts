import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { agents: string } }) {
  const body: {
    [k: string]: unknown;
  } = {
    error: 'Unable to retrieve listings',
  };
  let status = 400;

  try {
    const payload = await request.json();
    delete payload.script_fields;
    if (payload.fields) payload.fields.push('data.photos');
    if (!payload.size) payload.size = 25;
    let should: { match: { [k: string]: string } }[] = [];
    if (params.agents) {
      params.agents.split(',').forEach(agent_id => {
        should = should.concat([
          {
            match: {
              'data.LA1_LoginName': agent_id,
            },
          },
          {
            match: {
              'data.LA2_LoginName': agent_id,
            },
          },
          {
            match: {
              'data.LA3_LoginName': agent_id,
            },
          },
        ]);
      });
    }
    payload.query = {
      bool: {
        should,
        minimum_should_match: 1,
      },
    };

    console.log(should);

    body.properties = await retrieveFromLegacyPipeline(payload);
    status = 200;
  } catch (e) {}

  return NextResponse.json(body, {
    status,
  });
}
