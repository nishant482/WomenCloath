import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { imageStorageProvider, storeImage } from "../src/services/image-storage.js";

const env = { CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_IMAGES_API_TOKEN: "test-secret" };
const format = { ext: "png", mime: "image/png" };
const url = "https://imagedelivery.net/test/image/public";

test("Cloudinary signed upload keeps secret on server and validates returned media", async () => {
  const cloudEnv = { CLOUDINARY_CLOUD_NAME: "rajo-test", CLOUDINARY_API_KEY: "key", CLOUDINARY_API_SECRET: "secret" };
  assert.equal(imageStorageProvider(cloudEnv), "cloudinary");
  assert.equal(imageStorageProvider({ ...cloudEnv, CLOUDINARY_API_SECRET: "" }), null);
  const request = async (endpoint, { body }) => {
    assert.equal(endpoint, "https://api.cloudinary.com/v1_1/rajo-test/image/upload");
    assert.equal(body.get("api_secret"), null);
    const publicId = body.get("public_id");
    assert.equal(body.get("signature"), createHash("sha256").update(`public_id=${publicId}&timestamp=${body.get("timestamp")}secret`).digest("hex"));
    return { ok: true, json: async () => ({ public_id: publicId, secure_url: `https://res.cloudinary.com/rajo-test/image/upload/v1/${publicId}.png` }) };
  };
  const result = await storeImage(Buffer.from("image"), format, { env: cloudEnv, request });
  assert.equal(result.provider, "cloudinary");
  assert.match(result.pathname, /^rajo\//);
  await assert.rejects(storeImage(Buffer.from("image"), format, { env: cloudEnv, request: async () => ({ ok: false, json: async () => ({ error: { message: "secret" } }) }) }), error => error.status === 502 && !error.message.includes("secret"));
});

test("storage configuration requires complete Cloudflare credentials", () => {
  assert.equal(imageStorageProvider({}), null);
  assert.equal(imageStorageProvider({ BLOB_READ_WRITE_TOKEN: "test" }), "vercel");
  assert.equal(imageStorageProvider({ ...env, BLOB_READ_WRITE_TOKEN: "test" }), "cloudflare");
  assert.equal(imageStorageProvider({ CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID, BLOB_READ_WRITE_TOKEN: "test" }), null);
});

test("Cloudflare upload sends server credentials and returns only public media details", async () => {
  const result = await storeImage(Buffer.from("image-bytes"), format, {
    env,
    request: async (endpoint, options) => {
      assert.equal(endpoint, `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`);
      assert.equal(options.headers.Authorization, "Bearer test-secret");
      assert.equal(options.body.get("requireSignedURLs"), "false");
      assert.equal(options.body.get("file").type, "image/png");
      assert.equal(await options.body.get("file").text(), "image-bytes");
      return { ok: true, json: async () => ({ success: true, result: { id: "image", variants: [url] } }) };
    },
  });
  assert.deepEqual(result, { provider: "cloudflare", pathname: "image", url });
});

test("upstream errors and missing public variants fail without exposing secrets", async () => {
  for (const request of [
    async () => { throw new Error("test-secret"); },
    async () => ({ ok: false, json: async () => ({ errors: ["test-secret"] }) }),
    async () => ({ ok: true, json: async () => ({ success: true, result: { id: "image", variants: ["https://example.com/public"] } }) }),
  ]) {
    await assert.rejects(storeImage(Buffer.from("image"), format, { env, request }), error => error.status === 502 && !error.message.includes("test-secret"));
  }
  await assert.rejects(storeImage(Buffer.from("image"), format, { env: {} }), { status: 503 });
});
