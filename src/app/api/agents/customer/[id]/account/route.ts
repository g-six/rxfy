import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { updateAgentCustomerAccount } from './model';
import { getUserSessionData } from '@/app/api/check-session/model';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await getUserSessionData(req.headers.get('authorization') || '', 'realtor');
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
  const [customer] = customers.filter(c => Number(c.agent_customer_id) === Number(params.id));
  const payload = await req.json();

  if (customer && Object.keys(payload).length) {
    const updates = await updateAgentCustomerAccount(Number(customer.id), payload);
    if (updates.error) return getResponse(updates, 400);
    return getResponse(updates);
  }
  return getResponse({
    params,
    payload,
  });
}
