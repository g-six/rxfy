import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { DocumentDataModel } from '@/_typings/document';

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

const gql_update_session = `mutation UpdateCustomerSession ($id: ID!, $last_activity_at: DateTime!) {
  session: updateCustomer(id: $id, data: { last_activity_at: $last_activity_at }) {
    record: data {
      id
      attributes {
        email
        full_name
        phone_number
        birthday
        last_activity_at
        yes_to_marketing
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

const gql_delete_folder = `mutation DeleteDocument ($id: ID!) {
  record: deleteDocument(id: $id) {
    data {
      id
      attributes {
        name
      }
    }
  }
}`;

const gql_delete_document = `mutation DeleteDocumentUpload ($id: ID!) {
  record: deleteDocumentUpload(id: $id) {
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

const gql_retrieve_documents = `query RetrieveDocuments ($filters: DocumentFiltersInput!, $pagination: PaginationArg) {
  documents(filters: $filters, pagination: $pagination) {
    data {
      id
      attributes {
        name
        url
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
 * POST /api/documents/<Cookies.get('cid')>
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 *      payload { name: 'filename or title', url: 'URL to file in S3', agent: 'agent.id (not agent_id)' }
 * @param request
 * @returns
 */
export async function POST(request: Request) {
  const authorization = await request.headers.get('authorization');
  const { name, agent } = await request.json();
  const id = Number(request.url.split('/').pop());
  let session_key = '';

  if (isNaN(id) || !authorization) {
    return new Response(
      JSON.stringify(
        {
          error: 'Sorry, please login',
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
  } else if (agent && agent.id && name) {
    const [prefix, previous_token] = authorization.split(' ');
    if (prefix.toLowerCase() === 'bearer') {
      const user = await getNewSessionKey(id, previous_token);
      if (user) {
        const { data: doc_response } = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: gql_document,
            variables: {
              data: {
                customer: id,
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
        error: 'Please login',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
      statusText: 'Please login',
    },
  );
}

/**
 * Updates a document folder and if payload includes it, appends a document upload
 * PUT /api/documents/<Cookies.get('cid')>
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 *      payload { name: 'folder name', upload?: { file_name: 'filename or title', url: 'URL to file in S3' } }
 * @param request
 * @returns
 */
export async function PUT(request: Request) {
  const authorization = await request.headers.get('authorization');
  const { name, upload, id: document } = await request.json();
  const id = Number(request.url.split('/').pop());
  let session_key = '';

  if (isNaN(id) || !authorization) {
    return new Response(
      JSON.stringify(
        {
          error: 'Sorry, please login',
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
  } else if (document && upload?.file_name && upload?.url) {
    const [prefix, previous_token] = authorization.split(' ');
    if (prefix.toLowerCase() === 'bearer') {
      const user = await getNewSessionKey(id, previous_token);
      try {
        if (user) {
          const { data: doc_response } = await axios.post(
            `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
            {
              query: gql_upload,
              variables: {
                data: {
                  ...upload,
                  document,
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
          let document_upload;
          if (doc_response.data?.createDocumentUpload?.data?.id) {
            const { id: upload_id, attributes } = doc_response.data?.createDocumentUpload?.data;
            document_upload = {
              ...attributes,
              id: upload_id,
              document: attributes.document.data,
            };
          }
          return new Response(
            JSON.stringify(
              {
                document_upload,
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
    }
  } else {
    const errors = [];
    if (!document) errors.push('provide the folder id (document_id)');
    if (!name) errors.push('name this document folder');
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
        error: 'Please login',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
      statusText: 'Please login',
    },
  );
}

/**
 * Deletes an upload from a document folder
 * DELETE /api/documents/<Cookies.get('cid')>?model=document-upload&id=x
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 * @param request
 * @returns
 */
export async function DELETE(request: Request) {
  const authorization = await request.headers.get('authorization');
  const url = new URL(request.url);
  const paths = url.pathname.split('/');
  const user_id = Number(paths.pop());

  let session_key = '';

  if (isNaN(user_id) || !authorization) {
    return new Response(
      JSON.stringify(
        {
          error: 'Sorry, please login',
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
  } else if (url.searchParams.get('model') && url.searchParams.get('id')) {
    const [prefix, previous_token] = authorization.split(' ');
    if (prefix.toLowerCase() === 'bearer') {
      const user = await getNewSessionKey(user_id, previous_token);
      try {
        if (user) {
          let query = '';
          switch (url.searchParams.get('model')) {
            case 'document-upload':
              query = gql_delete_document;
              break;
            case 'document':
              query = gql_delete_folder;
              break;
            default:
              return new Response(
                JSON.stringify(
                  {
                    error: `Sorry, please provide a valid record type`,
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

          const { data: doc_response } = await axios.post(
            `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
            {
              query,
              variables: {
                id: url.searchParams.get('id'),
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
        error: 'Please login',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
      statusText: 'Please login',
    },
  );
}

/**
 * Retrieves all documents for a user
 * GET /api/documents/<Cookies.get('cid')>
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 * @param request
 * @returns
 */
export async function GET(request: Request) {
  const authorization = await request.headers.get('authorization');
  const id = Number(request.url.split('/').pop());
  let session_key = '';

  if (isNaN(id) || !authorization) {
    return new Response(
      JSON.stringify(
        {
          error: 'Sorry, please login',
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
  } else {
    const [prefix, previous_token] = authorization.split(' ');
    if (prefix.toLowerCase() === 'bearer') {
      const user = await getNewSessionKey(id, previous_token);
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
    }
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please login',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
      statusText: 'Please login',
    },
  );
}

export async function getNewSessionKey(id: number, previous_token: string) {
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
      const dt = new Date().toISOString();
      const {
        data: {
          data: {
            session: { record },
          },
        },
      } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_update_session,
          variables: {
            id,
            last_activity_at: dt,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { birthday: birthdate, ...attributes } = record.attributes;
      let birthday;
      if (birthdate) {
        birthday = new Intl.DateTimeFormat('en-CA').format(new Date(`${birthdate}T00:00:00`));
      }

      return {
        ...attributes,
        session_key: `${encrypt(dt)}.${encrypted_email}`,
        birthday,
        id,
        email,
      };
    }
  }
}
