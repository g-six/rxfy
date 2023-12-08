import { AxiosError } from 'axios';
import { getResponse } from '../response-helper';
import { getUserSessionData, isRealtorRequest } from './model';
import { consoler } from '@/_helpers/consoler';
const FILE = 'api/check-session/route.ts';
export async function GET(request: Request) {
  let results = {};
  try {
    let user_type: 'realtor' | 'customer' = request.url.split('/').includes('agent') ? 'realtor' : 'customer';

    if (isRealtorRequest(request.url)) {
      user_type = 'realtor';
    }
    results = await getUserSessionData(request.headers.get('authorization') || '', user_type);
    consoler(FILE, results);
    const { error } = results as unknown as { error: string };
    if (error) return getResponse(results, 401);
  } catch (e) {
    const { response } = e as AxiosError;
    if (response?.data) {
      const { errors } = response?.data as unknown as {
        errors?: unknown[];
      };
      consoler(FILE, errors);
      return getResponse({ error: 'api.check-session.GET error.  See server logs for details' }, 400);
    }
    consoler(FILE, e);
    return getResponse({ e, error: 'api.check-session.GET error.  See server logs for details' }, 400);
  }
  return getResponse(results, 200);
}
