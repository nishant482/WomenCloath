import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fail } from "./auth.service.js";

export function r2Configured(env) {
  try {
    const url = new URL(env.R2_PUBLIC_URL);
    return /^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID || "") &&
      /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(env.R2_BUCKET || "") &&
      Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) &&
      url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}

export async function storeR2Image(buffer, { filename, mime }, env, client) {
  if (!r2Configured(env)) throw fail(503, "Image storage is not configured.");
  const ownedClient = !client;
  client ||= new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
    maxAttempts: 2,
  });
  const key = `rajo/${filename}`;
  try {
    await client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET, Key: key, Body: buffer,
      ContentType: mime, CacheControl: "public, max-age=31536000, immutable",
    }), { abortSignal: AbortSignal.timeout(20000) });
  } catch {
    throw fail(502, "Image upload failed. Check R2 access or try again shortly.");
  } finally {
    if (ownedClient) client.destroy();
  }
  return { provider: "r2", pathname: key, url: `${env.R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}` };
}
