import { AxiosError } from 'axios';
import { getResponse } from '../../response-helper';
import { getUserSessionData } from '../model';

export async function GET(request: Request) {
  let results = {};
  try {
    results = await getUserSessionData(request.headers.get('authorization') || '', 'realtor');
    const { error } = results as unknown as { error: string };
    if (error) return getResponse(results, 401);
    return getResponse(results, 200);
  } catch (e) {
    const { response } = e as AxiosError;
    if (response?.data) {
      const { errors } = response?.data as unknown as {
        errors?: unknown[];
      };
      return getResponse({ error: 'api.check-session.GET error.  See server logs for details' }, 400);
    }
    return getResponse({ e, error: 'api.check-session.GET error.  See server logs for details' }, 400);
  }
}
