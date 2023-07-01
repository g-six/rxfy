import { DeleteObjectCommand, DeleteObjectCommandOutput, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
export async function deleteObject(Key: string): Promise<DeleteObjectCommandOutput> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.NEXT_APP_S3_PAGES_BUCKET as string,
    Key,
  });

  const config: S3ClientConfig = {
    region: 'us-west-2',
    credentials: {
      accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
      secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
    },
  };

  const client = new S3Client(config);
  return await client.send(command);
}
