import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { NextRequest } from 'next/server';
import { getResponse } from '../../response-helper';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request: NextRequest) {
  let session_key = request.headers.get('authorization') || '';
  const { token, guid } = getTokenAndGuidFromSessionKey(session_key);
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  const { name, type } = await request.json();
  if (name) {
    const Key = `private-listings/${name}`;
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_APP_S3_PAGES_BUCKET as string,
      Key,
      ContentType: type,
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
    return getResponse({
      upload_url,
      file_path: Key,
      preview: `https://${process.env.NEXT_APP_S3_PAGES_BUCKET}/${Key}`,
    });
  }
}
