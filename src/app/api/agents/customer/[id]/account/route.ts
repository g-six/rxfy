import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';
import { updateAgentCustomerAccount } from './model';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkSession(req);
  const user = r as { [key: string]: string };
  if (!user?.id)
    return getResponse(
      {
        error: 'Please log in to your realtor account',
      },
      401,
    );

  const { customers } = r as {
    customers: { agent_customer_id: number; id: number }[];
  };
  const [customer] = customers.filter(c => c.agent_customer_id === Number(params.id));
  const payload = await req.json();

  if (customer && Object.keys(payload).length) {
    const updates = await updateAgentCustomerAccount(Number(customer.id), payload);
    return getResponse(updates);
  }
  return getResponse({
    params,
    payload,
    customer,
  });
}
