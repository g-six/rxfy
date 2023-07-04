import { getResponse } from '@/app/api/response-helper';
import axios from 'axios';
import { buildCacheFiles } from '../../model';

export async function GET(request: Request) {
  const url = new URL(request.url);
  let mls_id = url.pathname.split('/').pop() || '';
  try {
    buildCacheFiles(mls_id);
    const json_file = `https://pages.leagent.com/listings/${mls_id}/recent.json`;
    console.log('  Retrieve:', json_file);

    const cache = await axios.get(json_file);
    const { mls_data, ...property } = cache.data;
    console.log('  Cache for legacy data found', mls_data.guid);
    console.log('');
    return getResponse(property, 200);
  } catch (e) {
    console.log('No JSON cache for', mls_id);
  }

  const results = await buildCacheFiles(mls_id);
  return results?.code ? getResponse(results, Number(results.code)) : getResponse(results as unknown as { [key: string]: any });
}
