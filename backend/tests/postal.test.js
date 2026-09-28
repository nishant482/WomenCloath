import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { lookupPostalCode } from '../src/services/postal.service.js';
import { createApp } from '../src/app.js';
test('PIN lookup validates input and maps postal district/state without requiring a database', async () => {
 let calls = 0;
 const fetcher = async url => { calls++; assert.equal(url, 'https://api.postalpincode.in/pincode/302001'); return Response.json([{ Status: 'Success', PostOffice: [{ District: 'Jaipur', State: 'Rajasthan', Country: 'India' }] }]); };
 const app = createApp({ postalLookup: pin => lookupPostalCode(pin, fetcher), getConnection: () => { throw new Error('No database expected'); } });
 await request(app).get('/api/postal-codes/123').expect(400);
 const result = await request(app).get('/api/postal-codes/302001').expect(200);
 assert.equal(result.body.city, 'Jaipur'); assert.equal(result.body.state, 'Rajasthan');
 await request(app).get('/api/postal-codes/302001').expect(200); assert.equal(calls, 1);
});
test('PIN lookup handles missing records, provider outages and malformed payloads', async () => {
 await assert.rejects(lookupPostalCode('999999', async () => Response.json([{ Status: 'Error', PostOffice: null }])), { status: 404 });
 await assert.rejects(lookupPostalCode('111111', async () => { throw new Error('offline'); }), { status: 503 });
 await assert.rejects(lookupPostalCode('222222', async () => Response.json({})), { status: 503 });
});
