import { fail } from './auth.service.js';
const cache = new Map();
export async function lookupPostalCode(pin, fetcher = fetch) {
  if (!/^[1-9]\d{5}$/.test(pin)) throw fail(400, 'Enter a valid six-digit PIN code.');
  const cached = cache.get(pin);
  if (cached?.expires > Date.now()) return cached.value;
  let payload;
  try {
    const response = await fetcher(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Postal service unavailable');
    payload = await response.json();
  } catch { throw fail(503, 'PIN lookup is unavailable. Please enter your city and state manually.'); }
  const result = Array.isArray(payload) ? payload[0] : payload;
  if (result?.Status === 'Error') throw fail(404, 'PIN code not found. Please check it or enter your city and state manually.');
  const offices = result?.PostOffice?.filter(p => p.Country === 'India' && p.District && p.State) || [];
  if (!offices.length) throw fail(503, 'PIN lookup is unavailable. Please enter your city and state manually.');
  const locations = [...new Map(offices.map(p => [p.District + '|' + p.State, { city: p.District, state: p.State }])).values()];
  const value = { postalCode: pin, city: locations[0].city, state: locations[0].state, locations };
  if (cache.size >= 500) cache.delete(cache.keys().next().value);
  cache.set(pin, { value, expires: Date.now() + 86400000 });
  return value;
}
