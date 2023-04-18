import { GetObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extractBearerFromHeader } from '../../request-helper';
import { getResponse } from '../../response-helper';
import { getNewSessionKey } from '../../update-session';
import axios from 'axios';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';

/**
 * Retrieves signed document url
 * GET /api/documents
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 * @param request
 * @returns
 */
export async function GET(request: Request) {
  const token = extractBearerFromHeader(request.headers.get('authorization') || '');
  if (!token)
    return getResponse(
      {
        errors: {
          session: ['Please log in'],
        },
      },
      401,
    );

  const uri_encoded_key = request.url.split('/').pop();
  const config: S3ClientConfig = {
    region: 'us-west-2',
    credentials: {
      accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
      secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
    },
  };
  const client = new S3Client(config);

  if (uri_encoded_key) {
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_APP_S3_UPLOADS_BUCKET as string,
      Key: decodeURIComponent(uri_encoded_key),
    });
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return new Response(JSON.stringify({ url }, null, 4), { status: 200 });
  }
}

/**
 * Deletes an upload from a document folder
 * DELETE /api/documents/<document_uploads.id>
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 * @param request
 * @returns
 */
export async function DELETE(request: Request) {
  try {
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
    const document_upload_id = Number(paths.pop());

    if (!isNaN(Number(document_upload_id))) {
      const user = await getNewSessionKey(token, guid);
      if (user) {
        const { data: doc_response } = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: `mutation DeleteDocumentUpload ($id: ID!) {
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
            }`,
            variables: {
              id: Number(document_upload_id),
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
  } catch (e) {
    console.log(JSON.stringify(e, null, 4));
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
