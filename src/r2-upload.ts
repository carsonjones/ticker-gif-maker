import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_BUCKET_URL = process.env.PUBLIC_BUCKET_URL;

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  filePath: string,
  options?: { key?: string; contentType?: string }
): Promise<string> {
  const file = Bun.file(filePath);
  const buffer = await file.arrayBuffer();
  
  const ext = filePath.split('.').pop() || 'gif';
  const key = options?.key || `ticker/${randomUUID()}.${ext}`;
  const contentType = options?.contentType || (ext === 'gif' ? 'image/gif' : 'video/mp4');

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: contentType,
    })
  );

  // Return the public URL via custom domain
  return `${R2_PUBLIC_BUCKET_URL}/${key}`;
}
