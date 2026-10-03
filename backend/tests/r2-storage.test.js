import test from "node:test";
import assert from "node:assert/strict";
import { r2Configured, storeR2Image } from "../src/services/r2-storage.js";
import { imageStorageProvider } from "../src/services/image-storage.js";
const env = { R2_ACCOUNT_ID: "a".repeat(32), R2_BUCKET: "rajo-images", R2_ACCESS_KEY_ID: "key", R2_SECRET_ACCESS_KEY: "secret", R2_PUBLIC_URL: "https://images.example.com/" };
test("R2 requires complete credentials and a public HTTPS base", () => {
  assert.equal(r2Configured(env), true);
  assert.equal(imageStorageProvider(env), "r2");
  assert.equal(imageStorageProvider({ ...env, R2_SECRET_ACCESS_KEY: "", BLOB_READ_WRITE_TOKEN: "test" }), null);
  assert.equal(r2Configured({ ...env, R2_PUBLIC_URL: "http://images.example.com" }), false);
});
test("R2 upload stores content type and cache policy without exposing credentials", async () => {
  const result = await storeR2Image(Buffer.from("image"), { filename: "unique.png", mime: "image/png" }, env, {
    send: async command => {
      assert.equal(command.input.Bucket, "rajo-images");
      assert.equal(command.input.Key, "rajo/unique.png");
      assert.equal(command.input.ContentType, "image/png");
      assert.match(command.input.CacheControl, /immutable/);
    },
  });
  assert.deepEqual(result, { provider: "r2", pathname: "rajo/unique.png", url: "https://images.example.com/rajo/unique.png" });
  await assert.rejects(storeR2Image(Buffer.from("image"), { filename: "unique.png", mime: "image/png" }, env, {
    send: async () => { throw new Error("secret"); },
  }), error => error.status === 502 && !error.message.includes("secret"));
});
