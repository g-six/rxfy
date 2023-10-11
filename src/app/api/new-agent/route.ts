import { getResponse } from '../response-helper';
import { AxiosError } from 'axios';
import { getSmart } from '../agents/repair';
import { createAgentRecord } from '../agents/model';
import { SearchHighlightInput } from '@/_typings/maps';

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

      const results = await createAgentRecord({
        agent_id,
        email,
        phone,
        full_name,
        search_highlights: [target_city].concat(neighbourhoods).map((location: SearchHighlightInput) => {
          return {
            name: location.name,
            place_id: location.place_id,
            lat: location.lat,
            lng: location.lng,
            nelat: location.nelat,
            nelng: location.nelng,
            swlat: location.swlat,
            swlng: location.swlng,
          };
        }),
      });
      await getSmart(
        {
          ...results,
          search_highlights: neighbourhoods,
        },
        {
          city: target_city.name,
        },
      );
      return getResponse(results);
    }
  } catch (e) {
    const axerr = e as AxiosError;
    console.log(axerr);
    results.error = axerr.code as string;
  }

  return new Response(JSON.stringify(results, null, 4), { headers: { 'Content-Type': 'application/json' }, status: 401 });
}
