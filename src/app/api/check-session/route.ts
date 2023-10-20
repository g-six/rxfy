import { AxiosError } from 'axios';
import { getResponse } from '../response-helper';
import { getUserSessionData, isRealtorRequest } from './model';

export async function GET(
  request: Request,
  ctx?: {
    [key: string]: {
      [key: string]: string;
    };
  },
) {
  let results = {};
  try {
    let user_type: 'realtor' | 'customer' = request.url.split('/').includes('agent') ? 'realtor' : 'customer';
    if (isRealtorRequest(request.url)) {
      user_type = 'realtor';
    }
    console.error({ user_type });
    results = await getUserSessionData(request.headers.get('authorization') || '', user_type);
    const { error } = results as unknown as { error: string };
    if (error) return getResponse(results, 401);
  } catch (e) {
    const { response } = e as AxiosError;
    if (response?.data) {
      const { errors } = response?.data as unknown as {
        errors?: unknown[];
      };
      console.error(JSON.stringify(errors, null, 4));
      return getResponse({ error: 'api.check-session.GET error.  See server logs for details' });
    }
    console.error(JSON.stringify(e, null, 4));
    return getResponse({ error: 'api.check-session.GET error.  See server logs for details' });
  }
  return ctx?.config?.internal === 'yes' ? results : getResponse(results, 200);
}
