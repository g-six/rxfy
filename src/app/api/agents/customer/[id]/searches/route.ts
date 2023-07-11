import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';
import { getCustomerSearches } from './model';
import { CustomerSavedSearch } from '@/_typings/saved-search';

export async function GET(request: NextRequest) {
  const agents_customer_id = Number(request.url.split('/searches')[0].split('/').pop());
  if (isNaN(agents_customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }
  const agent = await checkSession(request, true);

  const {
    id: realtor,
    customers,
    session_key,
  } = agent as unknown as {
    id: number;
    customers: { notes: string[]; agent_customer_id: number }[];
    session_key: string;
  };
  if (!session_key) {
    return getResponse({
      error: "Please login to retrieve your customer's home alerts",
    });
  }
  const [customer] = customers.filter(c => c.agent_customer_id === agents_customer_id);

  if (!customer) {
    return getResponse({
      error: 'Please provide a valid customer relationship id',
    });
  }

  const records: CustomerSavedSearch[] = await getCustomerSearches(agents_customer_id);
  /////
  return getResponse({
    records,
    session_key,
  });
}
