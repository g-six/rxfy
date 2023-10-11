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
  let user_type: 'realtor' | 'customer' = request.url.split('/').includes('agent') ? 'realtor' : 'customer';
  if (isRealtorRequest(request.url)) {
    user_type = 'realtor';
  }
  const results = await getUserSessionData(request.headers.get('authorization') || '', user_type);
  const { error } = results as unknown as { error: string };
  if (error) return getResponse(results, 401);

  return ctx?.config?.internal === 'yes' ? results : getResponse(results, 200);
}
