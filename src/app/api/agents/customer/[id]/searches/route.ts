import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { getCustomerSearches } from './model';
import { CustomerSavedSearch } from '@/_typings/saved-search';
import { createSavedSearch } from '@/app/api/saved-searches/model';
import { getUserSessionData, isRealtorRequest } from '@/app/api/check-session/model';
import { AgentData } from '@/_typings/agent';

export async function GET(request: NextRequest) {
  const agents_customer_id = Number(request.url.split('/searches')[0].split('/').pop());
  if (isNaN(agents_customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }
  const user_type = isRealtorRequest(request.url) ? 'realtor' : 'customer';
  const authorization = request.headers.get('authorization') || '';
  const agent = await getUserSessionData(authorization, user_type);

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
export async function POST(request: NextRequest, { params }: { params: { [key: string]: string } }) {
  const user_type = isRealtorRequest(request.url) ? 'realtor' : 'customer';
  const authorization = request.headers.get('authorization') || '';
  const r = await getUserSessionData(authorization, user_type);

  const { customers, session_key } = r as AgentData & { session_key: string };
  if (!session_key) {
    return getResponse({
      error: "Please login to retrieve your customer's home alerts",
    });
  }

  const { id, search_params, customer: customer_id } = await request.json();
  if (customers) {
    const [customer] = customers.filter(c => Number(c.id) === customer_id);
    if (customer) {
      const record: CustomerSavedSearch = await createSavedSearch(id, search_params, customer_id);
      /////
      return getResponse({
        record,
        session_key,
      });
    }
  }

  return getResponse({
    error: 'Please provide a valid customer id',
    customer_id,
    params,
  });
}
