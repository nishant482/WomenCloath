import React, { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
export function AddressFields({ initial = {} }) {
  const [pin, setPin] = useState(initial.postalCode || ''), [city, setCity] = useState(initial.city || ''), [state, setState] = useState(initial.state || '');
  const [message, setMessage] = useState('Enter your PIN code to find city and state.'), [locations, setLocations] = useState([]);
  const pinRef = useRef(pin), edited = useRef({ city: Boolean(initial.city), state: Boolean(initial.state) });
  useEffect(() => {
    if (!/^[1-9]\d{5}$/.test(pin)) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setMessage('Finding city and state…');
      try {
        const result = await api('/postal-codes/' + pin, { signal: abort.signal });
        if (abort.signal.aborted || pinRef.current !== pin) return;
        if (!edited.current.city) setCity(result.city);
        if (!edited.current.state) setState(result.state);
        setLocations(result.locations || []);
        setMessage('City and state suggested from your PIN. Review and edit if needed.');
      } catch (e) { if (!abort.signal.aborted && pinRef.current === pin) setMessage(e.message); }
    }, 300);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [pin]);
  return <div className="address-fields">
    <label>Full name<input name="name" autoComplete="name" defaultValue={initial.name || ''} required minLength={2} maxLength={100} /></label>
    <label>Mobile number<input name="phone" type="tel" inputMode="numeric" autoComplete="tel" defaultValue={initial.phone || ''} required pattern="[6-9][0-9]{9}" maxLength={10} /></label>
    <label>PIN code<input name="postalCode" autoComplete="postal-code" inputMode="numeric" value={pin} required pattern="[1-9][0-9]{5}" maxLength={6} onChange={e => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 6); if (value === pinRef.current) return; pinRef.current = value; setPin(value); setCity(''); setState(''); setLocations([]); edited.current = { city: false, state: false }; setMessage('Enter a six-digit PIN code to find city and state.');
    }} /></label>
    <p className="postal-help" role="status">{message}</p>
    {locations.length > 1 && <label className="address-wide">Choose your postal district<select aria-label="Postal district" value={city + '|' + state} onChange={e => { const [c, s] = e.target.value.split('|'); setCity(c); setState(s); edited.current = { city: true, state: true }; }}><option value="">Choose district</option>{locations.map(p => <option key={p.city + p.state} value={p.city + '|' + p.state}>{p.city}, {p.state}</option>)}</select></label>}
    <label>City<input name="city" autoComplete="address-level2" value={city} required minLength={2} maxLength={80} onChange={e => { edited.current.city = true; setCity(e.target.value); }} /></label>
    <label>State<input name="state" autoComplete="address-level1" value={state} required minLength={2} maxLength={80} onChange={e => { edited.current.state = true; setState(e.target.value); }} /></label>
    <label className="address-wide">Address<input name="line1" autoComplete="address-line1" defaultValue={initial.line1 || ''} required minLength={5} maxLength={200} placeholder="House / flat number, building and street" /></label>
    <label className="address-wide">Apartment / landmark (optional)<input name="line2" autoComplete="address-line2" defaultValue={initial.line2 || ''} maxLength={200} /></label>
  </div>;
}
