import { createHash, randomUUID } from "node:crypto";
import { fail } from "./auth.service.js";
import { r2Configured, storeR2Image } from "./r2-storage.js";

export function imageStorageProvider(env = process.env) {
  if (env.R2_GATEWAY_URL || env.R2_GATEWAY_TOKEN) {
    try {
      const url = new URL(env.R2_GATEWAY_URL);
      return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash &&
        env.R2_GATEWAY_TOKEN ? "r2-worker" : null;
    } catch { return null; }
  }
  if (["R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_URL"].some(key => env[key]))
    return r2Configured(env) ? "r2" : null;
  if (env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_SECRET)
    return /^[a-z0-9_-]+$/i.test(env.CLOUDINARY_CLOUD_NAME || "") &&
      env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET ? "cloudinary" : null;
  // Never silently fall back when Cloudflare has been partially configured.
  if (env.CLOUDFLARE_ACCOUNT_ID || env.CLOUDFLARE_IMAGES_API_TOKEN)
    return /^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID || "") &&
      env.CLOUDFLARE_IMAGES_API_TOKEN ? "cloudflare" : null;
  return env.BLOB_READ_WRITE_TOKEN ? "vercel" : null;
}

export async function storeImage(buffer, { ext, mime }, {
  env = process.env, request = fetch,
} = {}) {
  const provider = imageStorageProvider(env);
  if (!provider) throw fail(503, "Image uploads are not configured. You can use an image URL instead.");
  const filename = `${randomUUID()}.${ext}`;
  if (provider === "r2-worker") {
    const pathname = `rajo/${filename}`;
    const url = `${env.R2_GATEWAY_URL.replace(/\/+$/, "")}/${pathname}`;
    try {
      const response = await request(url, {
        method: "PUT", headers: { Authorization: `Bearer ${env.R2_GATEWAY_TOKEN}`, "Content-Type": mime },
        body: buffer, signal: AbortSignal.timeout(20000), redirect: "error",
      });
      if (response.status !== 201) throw new Error("Storage rejected upload");
    } catch { throw fail(502, "Image upload failed. Please try again shortly."); }
    return { provider: "r2", pathname, url };
  }
  if (provider === "r2") return storeR2Image(buffer, { filename, mime }, env);
  if (provider === "cloudinary") {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `rajo/${randomUUID()}`;
    const signature = createHash("sha256")
      .update(`public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
      .digest("hex");
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: mime }), filename);
    form.append("public_id", publicId);
    form.append("timestamp", timestamp);
    form.append("api_key", env.CLOUDINARY_API_KEY);
    form.append("signature", signature);
    let response, data;
    try {
      response = await request(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST", body: form, signal: AbortSignal.timeout(20000),
      });
      data = await response.json();
    } catch {
      throw fail(502, "Image storage is temporarily unavailable. Please try again.");
    }
    let validUrl = false;
    try {
      const parsed = new URL(data?.secure_url);
      validUrl = parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com" &&
        parsed.pathname.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`);
    } catch { /* Invalid provider response. */ }
    if (!response.ok || !validUrl || data?.public_id !== publicId)
      throw fail(502, "Image upload failed. Check storage credentials and available quota.");
    return { provider, url: data.secure_url, pathname: data.public_id };
  }
  if (provider === "vercel") {
    const { put } = await import("@vercel/blob");
    const blob = await put(`rajo/${filename}`, buffer, {
      access: "public", contentType: mime, addRandomSuffix: true,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    return { provider, url: blob.url, pathname: blob.pathname };
  }
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), filename);
  form.append("requireSignedURLs", "false");
  let response, data;
  try {
    response = await request(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}` },
        body: form,
        signal: AbortSignal.timeout(20000),
      },
    );
    data = await response.json();
  } catch {
    throw fail(502, "Image storage is temporarily unavailable. Please try again.");
  }
  const variants = data?.result?.variants;
  const url = Array.isArray(variants) && variants.find(value => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" && parsed.hostname === "imagedelivery.net" &&
        parsed.pathname.endsWith("/public");
    } catch { return false; }
  });
  if (!response.ok || !data?.success || !data?.result?.id || !url)
    throw fail(502, "Cloudflare upload failed. Check Images access and the public image variant.");
  return { provider, url, pathname: data.result.id };
}
