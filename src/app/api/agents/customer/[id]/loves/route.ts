import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { LovedPropertyDataModel } from '@/_typings/property';
import { getCustomerLoves } from './model';
import { getUserSessionData, isRealtorRequest } from '@/app/api/check-session/model';
import { AgentData } from '@/_typings/agent';

export async function GET(request: NextRequest) {
  const agents_customer_id = Number(request.url.split('/loves')[0].split('/').pop());
  if (isNaN(agents_customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }
  const user_type = isRealtorRequest(request.url) ? 'realtor' : 'customer';
  const authorization = request.headers.get('authorization') || '';
  const session = await getUserSessionData(authorization, user_type);
  const agent = session as AgentData & { session_key: string };

  const { id: realtor, customers, session_key } = agent;
  if (customers) {
    const [customer] = customers.filter(c => c.agent_customer_id === agents_customer_id);
    if (customer) {
      const records: LovedPropertyDataModel[] = await getCustomerLoves(agents_customer_id);
      return getResponse({
        records,
        session_key,
      });
    }
  }

  return getResponse({
    error: 'Please provide a valid customer relationship id',
  });
}
