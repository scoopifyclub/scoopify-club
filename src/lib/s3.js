import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// The only bucket variable. Objects are private: no ACL is ever set and the
// bucket must have Block Public Access on, so viewers need a signed URL.
export const BUCKET_ENV = 'AWS_BUCKET_NAME';
export const VIEW_URL_TTL_SECONDS = 5 * 60;
export const UPLOAD_URL_TTL_SECONDS = 5 * 60;

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(`Photo storage is not configured (set ${BUCKET_ENV}, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)`);
    this.name = 'StorageNotConfiguredError';
  }
}

export function isStorageConfigured() {
  return Boolean(
    process.env[BUCKET_ENV] && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
}

function getBucket() {
  if (!isStorageConfigured()) throw new StorageNotConfiguredError();
  return process.env[BUCKET_ENV];
}

let client;
let clientKey;
function getClient() {
  const key = [process.env.AWS_REGION, process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY].join('|');
  if (!client || clientKey !== key) {
    client = new S3Client({
      region: process.env.AWS_REGION,
      // Otherwise presigned PUTs carry a checksum of an empty body and S3 rejects the upload.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    clientKey = key;
  }
  return client;
}

export async function putPrivateObject({ key, body, contentType }) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'private, max-age=0, no-store',
      ServerSideEncryption: 'AES256',
    })
  );
  return key;
}

/** Size and content type of an object, or null when it does not exist. */
export async function headObject(key) {
  try {
    const head = await getClient().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return { size: Number(head.ContentLength), contentType: head.ContentType || null };
  } catch (error) {
    if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
}

/** First `length` bytes of an object, for content sniffing. */
export async function readObjectPrefix(key, length = 32) {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key, Range: `bytes=0-${length - 1}` })
  );
  return Buffer.from(await res.Body.transformToByteArray());
}

/**
 * Signed PUT for a direct browser upload. The browser must send exactly the
 * returned headers; they are part of the signature.
 */
export async function getSignedUploadUrl(key, contentType, expiresIn = UPLOAD_URL_TTL_SECONDS) {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  });
  const url = await getSignedUrl(getClient(), command, { expiresIn, signableHeaders: new Set(['content-type']) });
  return { url, headers: { 'Content-Type': contentType, 'x-amz-server-side-encryption': 'AES256' } };
}

export async function getSignedDownloadUrl(key, expiresIn = VIEW_URL_TTL_SECONDS) {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getClient(), command, { expiresIn });
}

export async function deleteFromS3(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

/** Object key from a legacy public URL (https://<bucket>.s3[.<region>].amazonaws.com/<key>). */
export function keyFromLegacyUrl(url) {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (!/\.s3[.-]([a-z0-9-]+\.)?amazonaws\.com$/.test(parsed.hostname)) return null;
    return decodeURIComponent(parsed.pathname.replace(/^\//, '')) || null;
  } catch {
    return null;
  }
}
