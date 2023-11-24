import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { getCustomerLoves, removeCustomerLove } from '../model';
import { getUserSessionData, isRealtorRequest } from '@/app/api/check-session/model';

export async function DELETE(request: NextRequest) {
  const customer_id = Number(request.url.split('/loves/')[0].split('/').pop());
  const love_id = Number(request.url.split('/loves/')[1].split('/').pop());
  if (isNaN(customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }
  if (isNaN(love_id)) {
    return getResponse({
      error: 'Please provide a valid id for the love record',
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
    customers: { notes: string[]; id: number }[];
    session_key: string;
  };

  const [customer] = customers.filter(customer => {
    const { agent_customer_id } = customer as unknown as {
      agent_customer_id: number;
    };
    return customer_id === agent_customer_id;
  });

  let love;
  if (customer) {
    const loves = await getCustomerLoves(customer_id);
    love = loves.filter(l => {
      return l.love === love_id;
    })[0];
    if (love) {
      const deleted = await removeCustomerLove(love_id);
      return getResponse({ session_key, deleted });
    }
  }

  return getResponse({
    love,
    love_id,
    realtor,
    customer,
    session_key,
  });
}
