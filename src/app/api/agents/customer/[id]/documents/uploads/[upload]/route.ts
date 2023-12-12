import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { graphQL } from '@/app/api/_helpers/graphql-helper';
import { getUserSessionData, isRealtorRequest } from '@/app/api/check-session/model';
import { AgentData } from '@/_typings/agent';
import { gql_delete_doc_upload } from '@/app/api/document-uploads/gql';

export async function DELETE(req: NextRequest, { params: { upload, id: agent_customer_id } }: { params: { upload: string; id: string } }) {
  const user_type = isRealtorRequest(req.url) ? 'realtor' : 'customer';
  const authorization = req.headers.get('authorization') || '';
  const response = await getUserSessionData(authorization, user_type);
  const user = response as unknown as AgentData;

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
