import axios from 'axios';
import { getNewSessionKey } from '@/app/api/update-session';
import { getResponse } from '@/app/api/response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

/**
 * Updates a document folder and if payload includes it, appends a document upload
 * PUT /api/documents/<document_folder_id>
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 *      payload { name: 'folder name', upload?: { file_name: 'filename or title', url: 'URL to file in S3' } }
 * @param request
 * @returns
 */
export async function PUT(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  const document_folder_id = Number(request.url.split('/').pop());

  let session_key = undefined;

  if (!isNaN(document_folder_id)) {
  } else {
    const errors = [];
    if (!document) errors.push('provide the folder id (document_id)');

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
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token || !guid)
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
    const user = await getNewSessionKey(token, guid);
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
