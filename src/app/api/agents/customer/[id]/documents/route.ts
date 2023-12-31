import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { getCustomerDocuments } from './model';
import { DocumentDataModel } from '@/_typings/document';
import { createDocumentFolder } from '@/app/api/documents/model';
import { getUserSessionData, isRealtorRequest } from '@/app/api/check-session/model';

export async function GET(request: NextRequest, { params }: { params: { [key: string]: string } }) {
  const agents_customer_id = Number(params.id);
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
      error: "Please login to retrieve your customer's documents",
    });
  }
  const [customer] = customers.filter(c => c.agent_customer_id === agents_customer_id);

  if (!customer) {
    return getResponse({
      error: 'Please provide a valid customer relationship id',
    });
  }

  const documents: DocumentDataModel[] = await getCustomerDocuments(agents_customer_id);
  /////
  return getResponse({
    documents,
    session_key,
  });
}

export async function POST(request: NextRequest, { params }: { params: { [key: string]: string } }) {
  const agents_customer_id = Number(params.id);
  if (isNaN(agents_customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }

  const authorization = request.headers.get('authorization') || '';
  const agent = await getUserSessionData(authorization, 'realtor');

  const { name } = await request.json();
  const {
    id: realtor,
    agent: agent_record_id,
    customers,
    session_key,
  } = agent as unknown as {
    id: number;
    agent: number;
    customers: { id: number; notes: string[]; agent_customer_id: number }[];
    session_key: string;
  };
  if (!session_key) {
    return getResponse({
      error: "Please login to retrieve your customer's documents",
    });
  }
  const [customer] = customers.filter(c => c.agent_customer_id === agents_customer_id);

  if (!customer) {
    return getResponse({
      error: 'Please provide a valid customer relationship id',
    });
  }

  const doc_response = await createDocumentFolder(name, Number(customer.id), agent_record_id);

  return getResponse({
    document: {
      name: doc_response.name,
      id: doc_response.id,
      document_uploads: {
        data: [],
      },
    },
  });
}
