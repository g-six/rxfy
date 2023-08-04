import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';
import { getCustomerDocuments } from './model';
import { DocumentDataModel } from '@/_typings/document';
import { createDocumentFolder } from '@/app/api/documents/model';

const gql_document = `mutation CreateDocument ($data: DocumentInput!) {
  createDocument(data: $data) {
    data {
      id
      attributes {
        document_uploads {
          data {
            id 
            attributes {
              url
              file_name
              createdAt
              updatedAt
            }
          }
        }
        name
        agent {
          data {
            id
          }
        }
      }
    }
  }
}`;

export async function GET(request: NextRequest, { params }: { params: { [key: string]: string } }) {
  const agents_customer_id = Number(params.id);
  if (isNaN(agents_customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }
  const agent = await checkSession(request, { config: { internal: 'yes' } });

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
  const agent = await checkSession(request, { config: { internal: 'yes' } });
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
