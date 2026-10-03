import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare-images/worker.js';
import { imageStorageProvider, storeImage } from '../src/services/image-storage.js';
const url = 'https://images.example.com/rajo/00000000-0000-0000-0000-000000000000.png';
const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
test('image worker rejects anonymous writes, invalid formats and oversized bodies', async () => {
  let writes = 0;
  const env = { UPLOAD_TOKEN: 'test-secret', IMAGES: { put: async () => { writes++; } } };
  for (const [body, headers, status] of [
    [png, {}, 401],
    ['not an image at all', { Authorization: 'Bearer test-secret' }, 400],
    [new Uint8Array(3*1024*1024+1), { Authorization: 'Bearer test-secret' }, 413],
    [png, { Authorization: 'Bearer test-secret' }, 201],
  ]) {
    assert.equal((await worker.fetch(new Request(url, { method: 'PUT', body, headers }), env)).status, status);
  }
  assert.equal(writes, 1);
});
test('image worker serves public images and returns a missing-image response', async () => {
  const object = { body: png, size: png.length, httpEtag: '"etag"', writeHttpMetadata: headers => headers.set('Content-Type','image/png') };
  const env = { IMAGES: { get: async () => object, head: async () => object } };
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/png');
  assert.equal((await worker.fetch(new Request(url, { headers: { 'If-None-Match': '"etag"' } }), env)).status, 304);
  assert.equal((await worker.fetch(new Request(url), { IMAGES: { get: async () => null } })).status, 404);
});
test('backend gateway stores uploads with a server-only token', async () => {
  const env = { R2_GATEWAY_URL: 'https://images.example.com', R2_GATEWAY_TOKEN: 'test-secret' };
  assert.equal(imageStorageProvider(env), 'r2-worker');
  assert.equal(imageStorageProvider({ ...env, R2_GATEWAY_TOKEN: '' }), null);
  const result = await storeImage(Buffer.from(png), { mime: 'image/png', ext: 'png' }, { env, request: async (target, options) => {
    assert.match(target, /^https:\/\/images.example.com\/rajo\//);
    assert.equal(options.headers.Authorization, 'Bearer test-secret');
    assert.equal(options.redirect, 'error');
    return { status: 201 };
  } });
  assert.equal(result.provider, 'r2');
  assert.equal(JSON.stringify(result).includes('test-secret'), false);
});
