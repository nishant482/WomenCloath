import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../../frontend/src/api.js';

test('API client rejects malformed success and error responses without reporting a saved record', async (t) => {
  for (const status of [200, 500, 502]) {
    t.mock.method(globalThis, 'fetch', async () => new Response('<html>Unavailable</html>', { status }));
    await assert.rejects(api('/admin/products'), error => error.status === status && /store/.test(error.message));
    t.mock.restoreAll();
  }
});
test('API client preserves JSON validation errors and valid payloads', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'SKU already exists.' }, { status: 409 }));
  await assert.rejects(api('/admin/products'), { message: 'SKU already exists.', status: 409 });
  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ id: 25 }, { status: 201 }));
  assert.deepEqual(await api('/admin/products', { method: 'POST', body: {} }), { id: 25 });
});
