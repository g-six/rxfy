import { getResponse } from '@/app/api/response-helper';
import axios from 'axios';
import { buildCacheFiles } from '../../model';

export async function GET(request: Request) {
  const url = new URL(request.url);
  let mls_id = url.pathname.split('/').pop() || '';
  const results = await buildCacheFiles(mls_id);
  return results?.code ? getResponse(results, Number(results.code)) : getResponse(results as unknown as { [key: string]: any });
}
