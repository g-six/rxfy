import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';

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
  const agent = await checkSession(request, true);

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
    const { id, saved_searches } = customer as unknown as {
      saved_searches: { id: number }[];
      id: number;
    };
    saved_searches.filter((saved_search: { id: number }) => {
      console.log({ saved_id: saved_search.id, customer_id, id, love_id });
      return saved_search.id === love_id;
    });
    return customer_id === id;
    return (
      customer_id === id &&
      saved_searches.filter((saved_search: { id: number }) => {
        console.log({ id: saved_search.id, customer_id, love_id });
        return saved_search.id === love_id;
      }).length > 0
    );
  });

  return getResponse({
    love_id,
    realtor,
    customer,
    session_key,
  });
}
