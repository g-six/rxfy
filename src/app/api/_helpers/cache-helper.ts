import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

export function invalidateCache(Items: string[]) {
  const NEXT_APP_SITES_DIST_ID = process.env.NEXT_APP_SITES_DIST_ID as string;
  const client = new CloudFrontClient({
    region: 'us-west-2',
    credentials: {
      accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
      secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
    },
  });
  const command = new CreateInvalidationCommand({
    DistributionId: NEXT_APP_SITES_DIST_ID,
    InvalidationBatch: {
      CallerReference: new Date().getTime().toString(),
      Paths: {
        Quantity: Items.length,
        Items,
      },
    },
  });
  console.log('Invalidating cache for ', NEXT_APP_SITES_DIST_ID);
  console.log(JSON.stringify(Items, null, 4));
  return client.send(command);
}

export function createCacheItem(Body: any, Key: string, ContentType: string = 'text/json') {
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_APP_S3_PAGES_BUCKET as string,
    Key,
    Body,
    ContentType,
  });
  invalidateCache(['/' + Key]);

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

  return `${process.env.NEXT_APP_S3_PAGES_BUCKET}/${Key}`;
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
    .then(console.log)
    .catch(console.error)
    .finally(() => {
      console.log('S3 upload complete', Key);
    });

  return `${process.env.NEXT_APP_S3_DOCUMENTS_BUCKET}/${Key}`;
}
