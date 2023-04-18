import axios from 'axios';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { encrypt } from '@/_utilities/encryption-helper';
import { DocumentDataModel } from '@/_typings/document';
import updateSessionKey from '../../update-session';
import { extractBearerFromHeader } from '../../request-helper';
import { getResponse } from '../../response-helper';

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
  const token = extractBearerFromHeader(request.headers.get('authorization') || '');
  if (!token || token.split('-').length !== 2)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  const { name, agent } = await request.json();
  let session_key = undefined;

  if (agent && agent.id && name) {
    const user = await getNewSessionKey(token);
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
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
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
 * Updates a document folder and if payload includes it, appends a document upload
 * PUT /api/documents/<document_folder_id>
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 *      payload { name: 'folder name', upload?: { file_name: 'filename or title', url: 'URL to file in S3' } }
 * @param request
 * @returns
 */
export async function PUT(request: Request) {
  const token = extractBearerFromHeader(request.headers.get('authorization') || '');
  if (!token || token.split('-').length !== 2)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  const document_folder_id = Number(request.url.split('/').pop());

  const { upload } = await request.json();
  let session_key = undefined;

  if (!isNaN(document_folder_id) && upload?.name && upload?.size && upload?.type) {
    if (upload?.name && upload?.size && upload?.type) {
      const user = await getNewSessionKey(token);
      try {
        if (user) {
          session_key = user.session_key;

          const command = new PutObjectCommand({
            Bucket: process.env.NEXT_APP_S3_UPLOADS_BUCKET as string,
            Key: upload.name,
            ContentType: upload.type,
          });
          const config: S3ClientConfig = {
            region: 'us-west-2',
            credentials: {
              accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
              secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
            },
          };
          const client = new S3Client(config);
          const upload_url = await getSignedUrl(client, command, { expiresIn: 3600 });

          const { data: doc_response } = await axios.post(
            `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
            {
              query: gql_upload,
              variables: {
                data: {
                  file_name: upload.name,
                  url: upload.name,
                  document: Number(document_folder_id),
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
          if (doc_response.data?.createDocumentUpload?.data?.id) {
            const { id: upload_id, attributes } = doc_response.data?.createDocumentUpload?.data;
            return new Response(
              JSON.stringify(
                {
                  session_key,
                  document_upload: {
                    ...attributes,
                    id: upload_id,
                    document: attributes.document.data,
                    upload_url,
                  },
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
        }
      } catch (e) {
        console.log(JSON.stringify(e, null, 4));
      } finally {
        console.log(JSON.stringify({ user }, null, 4));
      }
    }
  } else {
    const errors = [];
    if (!document) errors.push('provide the folder id (document_id)');
    if (!upload) {
      errors.push('attach an upload');
    } else {
      if (!upload.url) errors.push('provide the url to this document upload');
      if (!upload.file_name) errors.push('name this document upload');
    }

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
        error: session_key ? 'An error has occurred in uploading a file' : 'Please login to upload a document',
        session_key,
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: session_key ? 400 : 401,
    },
  );
}

/**
 * Deletes a document folder
 * DELETE /api/documents?model=document-upload&id=x
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 * @param request
 * @returns
 */
export async function DELETE(request: Request) {
  const token = extractBearerFromHeader(request.headers.get('authorization') || '');
  if (!token || token.split('-').length !== 2)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  const url = new URL(request.url);
  const paths = url.pathname.split('/');
  const document_folder_id = Number(paths.pop());

  if (!isNaN(document_folder_id)) {
    const user = await getNewSessionKey(token);
    try {
      if (user) {
        const { data: doc_response } = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: `mutation DeleteDocument ($id: ID!) {
              record: deleteDocument(id: $id) {
                data {
                  id
                  attributes {
                    name
                  }
                }
              }
            }`,
            variables: {
              id: Number(document_folder_id),
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
              'Content-Type': 'application/json',
            },
          },
        );
        let record;

        if (doc_response.data?.record?.data?.id) {
          const { id: upload_id, attributes } = doc_response.data?.record?.data;
          record = {
            ...attributes,
            id: upload_id,
          };
        }
        return new Response(
          JSON.stringify(
            {
              record,
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
      console.log(JSON.stringify(e, null, 4));
    } finally {
      console.log(JSON.stringify({ user }, null, 4));
    }
  } else {
    const errors = [];
    if (!url.searchParams.get('id')) errors.push('provide the record id to be deleted');
    if (!url.searchParams.get('model')) errors.push('the type of record you would like to delete');

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
        error: 'Please login to delete your document',
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
  const token = extractBearerFromHeader(request.headers.get('authorization') || '');
  if (!token || token.split('-').length !== 2)
    return getResponse(
      {
        error: 'Please login to retrieve documents',
      },
      401,
    );

  const id = Number(request.url.split('/').pop());
  let session_key = '';

  const user = await getNewSessionKey(token);
  if (user) {
    const { data: doc_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_retrieve_documents,
        variables: {
          filters: {
            customer: {
              id: {
                eq: id,
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

export async function getNewSessionKey(previous_token: string) {
  const id = Number(previous_token.split('-')[1]);
  const { data: response_data } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gqlFindCustomer,
      variables: {
        id,
      },
    },
    {
      headers,
    },
  );

  if (response_data.data?.customer?.data?.attributes) {
    const { email, last_activity_at } = response_data.data?.customer?.data?.attributes;
    const encrypted_email = encrypt(email);
    const compare_key = `${encrypt(last_activity_at)}.${encrypted_email}`;

    if (compare_key === previous_token) {
      return await updateSessionKey(id, email, 'Customer');
    }
  }
}
