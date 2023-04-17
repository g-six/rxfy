import { GetObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Retrieves signed document url
 * GET /api/documents/<Cookies.get('guid')>
 *      headers { Authorization: Bearer <Cookies.get('session_key')> }
 * @param request
 * @returns
 */
export async function GET(request: Request) {
  const Key = request.url.split('/').pop();
  const config: S3ClientConfig = {
    region: 'us-west-2',
    credentials: {
      accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
      secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
    },
  };
  const client = new S3Client(config);

  if (Key) {
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_APP_S3_UPLOADS_BUCKET as string,
      Key,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return new Response(JSON.stringify({ url }, null, 4), { status: 200 });
  }
}
