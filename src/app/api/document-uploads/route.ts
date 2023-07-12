import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../response-helper';
import { getNewSessionKey } from '../update-session';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';
import { cookies } from 'next/headers';

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

/**
 * Updates a document folder and if payload includes it, appends a document upload
 * PUT /api/documents/<document_folder_id>
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 *      payload { name: 'folder name', upload?: { file_name: 'filename or title', url: 'URL to file in S3' } }
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

  const { document: document_folder_id, upload } = await request.json();
  let session_key = undefined;

  if (!isNaN(document_folder_id) && upload?.name && upload?.size && upload?.type) {
    if (upload?.name && upload?.size && upload?.type) {
      const user = await getNewSessionKey(token, guid, cookies().get('session_as')?.value === 'realtor' ? 'realtor' : 'customer');
      try {
        if (user) {
          session_key = user.session_key;

          const command = new PutObjectCommand({
            Bucket: process.env.NEXT_APP_S3_DOCUMENTS_BUCKET as string,
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
