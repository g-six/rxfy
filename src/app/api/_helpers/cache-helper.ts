import { CloudFrontClient, CreateInvalidationCommand, CreateInvalidationCommandOutput } from '@aws-sdk/client-cloudfront';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

export function invalidateCache(Items: string[], DistributionId = process.env.NEXT_APP_S3_PAGES_BUCKET as string) {
  try {
    const client = new CloudFrontClient({
      region: 'us-west-2',
      credentials: {
        accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
        secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
      },
    });
    const command = new CreateInvalidationCommand({
      DistributionId,
      InvalidationBatch: {
        CallerReference: new Date().getTime().toString(),
        Paths: {
          Quantity: Items.length,
          Items,
        },
      },
    });
    console.log('Invalidating cache for ', DistributionId);
    console.log(JSON.stringify(Items, null, 4));
    return client.send(command);
  } catch (e) {
    console.error('Error in function invalidateCache');
    console.log(JSON.stringify({ Items }, null, 4));
    return { Items, error: 'Failed to invalidate' } as unknown as CreateInvalidationCommandOutput;
  }
}

export function createCacheItem(
  Body: any,
  Key: string,
  ContentType: string = 'text/json',
  invalidate = true,
  Bucket = process.env.NEXT_APP_S3_PAGES_BUCKET as string,
) {
  const command = new PutObjectCommand({
    Bucket,
    Key,
    Body,
    ContentType,
  });
  invalidate && invalidateCache(['/' + Key]);

  const config: S3ClientConfig = {
    region: 'us-west-2',
    credentials: {
      accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
      secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
    },
  };

  const client = new S3Client(config);

  client
    .send(command)
    .then(console.log)
    .catch(console.error)
    .finally(() => {
      console.log('S3 upload complete', Key);
    });

  return `${Bucket}/${Key}`;
}

export function createTempDocument(Body: any, file_name: string, ContentType: string) {
  const Key = `tmp/${file_name}`;
  const command = new PutObjectCommand({
    Bucket: `${process.env.NEXT_APP_S3_DOCUMENTS_BUCKET}`,
    Body,
    Key,
    ContentType,
  });

  const config: S3ClientConfig = {
    region: 'us-west-2',
    credentials: {
      accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
      secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
    },
  };

  const client = new S3Client(config);

  client
    .send(command)
    .catch(console.error)
    .finally(() => {
      console.log('S3 upload complete', Key);
    });

  return `${process.env.NEXT_APP_S3_DOCUMENTS_BUCKET}/${Key}`;
}
