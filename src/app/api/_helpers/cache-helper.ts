import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

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
  return client.send(command);
}
