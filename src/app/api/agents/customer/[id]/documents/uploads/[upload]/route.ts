import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';
import { graphQL } from '@/app/api/_helpers/graphql-helper';
import { gql_delete_doc_upload } from '@/app/api/document-uploads/[id]/route';

export async function DELETE(req: NextRequest, { params: { upload, id: agent_customer_id } }: { params: { upload: string; id: string } }) {
  const r = await checkSession(req);
  const user = r as { id: number; customers: { agent_customer_id: number; id: number }[] };
  if (!user?.id)
    return getResponse(
      {
        error: 'Please log in to your realtor account',
      },
      401,
    );

  if (!agent_customer_id || !user.customers || user.customers.length === 0)
    return getResponse(
      {
        error: 'Sorry, this customer does not have you as their registered realtor.',
        agent_customer_id,
        user,
      },
      401,
    );
  const [customer] = user.customers.filter(c => {
    return c.agent_customer_id === Number(agent_customer_id);
  });

  if (!customer) {
    return getResponse(
      {
        error: 'Sorry, this customer does not have you as their registered realtor.',
        agent_customer_id,
        user,
      },
      401,
    );
  }

  const {
    record: { data: record },
  } = await graphQL(gql_delete_doc_upload, { id: Number(upload) });

  return getResponse({ record, upload, customer });
}
