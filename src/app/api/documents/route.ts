import axios, { AxiosError } from 'axios';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DocumentDataModel } from '@/_typings/document';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '@/app/api/response-helper';
import { getNewSessionKey } from '@/app/api/update-session';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gqlFindCustomer = `query FindCustomer($id: ID!) {
  customer(id: $id) {
    data {
      id
      attributes {
        email
        last_activity_at
      }
    }
  }
}`;

const gql_upload = `mutation UploadDocument ($data: DocumentUploadInput!) {
  createDocumentUpload(data: $data) {
    data {
      id
      attributes {
        file_name
        url
        document {
          data {
            id
          }
        }
      }
    }
  }
}`;

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

const gql_retrieve_documents = `query RetrieveDocuments ($filters: DocumentFiltersInput!, $pagination: PaginationArg) {
  documents(filters: $filters, pagination: $pagination) {
    data {
      id
      attributes {
        name
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
        agent {
          data {
            id
          }
        }
      }
    }
  }
}`;

/**
 * Creates a document record
 * POST /api/documents
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 *      payload { name: 'filename or title', url: 'URL to file in S3', agent: 'agent.id (not agent_id)' }
 * @param request
 * @returns
 */
export async function POST(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  const { name, agent } = await request.json();
  let session_key = undefined;

  if (agent && agent.id && name) {
    const user = await getNewSessionKey(token, guid);
    if (user) {
      session_key = user.session_key;
      const { data: doc_response } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_document,
          variables: {
            data: {
              customer: user.id,
              agent: agent.id,
              name,
            },
          },
        },
        {
          headers,
        },
      );
      let document;
      if (doc_response.data?.createDocument?.data?.id) {
        const { id, attributes } = doc_response.data?.createDocument?.data;
        document = {
          ...attributes,
          id,
        };
      }
      return new Response(
        JSON.stringify(
          {
            document,
            session_key: user.session_key,
          },
          null,
          4,
        ),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        },
      );
    }
  } else {
    const errors = [];
    if (!agent || !agent.id) errors.push('select an agent');
    if (!name) errors.push('name this document');

    return new Response(
      JSON.stringify(
        {
          error: `Sorry, please: \n${errors.join('\n • ')}`,
        },
        null,
        4,
      ),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 401,
        statusText: 'Sorry, please login',
      },
    );
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please login to create a document folder',
        session_key,
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
    },
  );
}

/**
 * Retrieves all documents for a user
 * GET /api/documents
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 * @param request
 * @returns
 */
export async function GET(request: Request) {
  try {
    const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
    if (!token || !guid)
      return getResponse(
        {
          error: 'Please login',
        },
        401,
      );

    const user = await getNewSessionKey(token, guid);
    if (user) {
      const { data: doc_response } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_retrieve_documents,
          variables: {
            filters: {
              customer: {
                id: {
                  eq: user.id,
                },
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );
      let documents = [];
      if (doc_response.data?.documents?.data) {
        documents = doc_response.data?.documents?.data.map((doc: DocumentDataModel) => {
          return {
            ...doc.attributes,
            id: doc.id,
          };
        });
      }

      return new Response(
        JSON.stringify(
          {
            documents,
            session_key: user.session_key,
          },
          null,
          4,
        ),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        },
      );
    }
  } catch (e) {
    const errors = e as AxiosError;
    console.log('API Error: documents.GET');
    console.log(errors.message);
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please login to retrieve documents',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
    },
  );
}
