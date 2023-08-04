import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { NextRequest } from 'next/server';
import { getResponse } from '@/app/api/response-helper';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { invalidateCache } from '../_helpers/cache-helper';
import { CreateInvalidationCommandOutput } from '@aws-sdk/client-cloudfront';

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

  const { file_full_path, type } = await request.json();
  if (file_full_path) {
    const Key = file_full_path;
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
    const upload_url = await getSignedUrl(client, command);
    invalidateCache(['/' + Key]);
    return getResponse({
      upload_url,
      file_path: Key,
      url: `https://${process.env.NEXT_APP_S3_PAGES_BUCKET}/${Key}`,
    });
  }
}

export async function PUT(request: NextRequest) {
  let session_key = request.headers.get('authorization') || '';
  const { token, guid } = getTokenAndGuidFromSessionKey(session_key);
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  const { Items } = await request.json();
  if (Items && Items.length) {
    const results: CreateInvalidationCommandOutput = await invalidateCache(Items);
    return getResponse({
      ...results.Invalidation,
      Items,
    });
  }
}
