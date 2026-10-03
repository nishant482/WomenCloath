import React, { useEffect, useState } from 'react';
import { Package, Heart, MapPin, UserRound, LogOut, ArrowRight, ShoppingBag } from 'lucide-react';
import { useStore } from './store-context.jsx';
import { api, productImage } from './api.js';
import { AddressFields } from './address-fields.jsx';
import './customer-account.css';
const money = value => '₹' + Number(value || 0).toLocaleString('en-IN');
const tabs = [['orders', 'My orders', Package], ['wishlist', 'My wishlist', Heart], ['addresses', 'Saved addresses', MapPin], ['profile', 'Profile details', UserRound]];
export function CustomerAccount({ auth }) {
 const store = useStore();
 const [tab, setTab] = useState('orders'), [orders, setOrders] = useState([]), [loading, setLoading] = useState(false);
 const [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [addressEdit, setAddressEdit] = useState(null);
 const load = async () => { const r = await api('/orders'); setOrders(r.items); };
 useEffect(() => {
  if (!store.user) { setOrders([]); return; }
  let active = true; setLoading(true);
  api('/orders').then(r => { if (active) setOrders(r.items); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
 }, [store.user?.id]);
 if (!store.user) return auth;
 const saved = store.products.filter(p => store.wish.includes(p.id));
 const addresses = store.user.addresses || [];
 const updateProfile = async fields => {
  const result = await api('/account', { method: 'PATCH', body: { name: store.user.name, phone: store.user.phone, addresses, ...fields } });
  store.setUser(result.user);
 };
 const action = async work => {
  setBusy(true); setError(''); setMessage('');
  try { await work(); } catch (e) { setError(e.message); } finally { setBusy(false); }
 };
 return <section className="account-page customer-hub page-width">
  <header className="customer-heading"><div><span className="eyebrow">YOUR RAJO ACCOUNT</span><h1>Hello, {store.user.name}.</h1><p>Your orders, favourite finds and personal details.</p></div><a href="/collections/all">Continue shopping <ArrowRight size={15} /></a></header>
  <div className="customer-layout"><aside className="customer-sidebar"><div className="customer-identity"><span>{store.user.name[0]?.toUpperCase()}</span><div><strong>{store.user.name}</strong><small>{store.user.email}</small></div></div><nav aria-label="Account sections">{tabs.map(([key, label, Icon]) => <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => { setTab(key); setError(''); setMessage(''); setAddressEdit(null); }}><Icon size={17} />{label}{key === 'wishlist' && <b>{saved.length}</b>}</button>)}</nav><button className="customer-signout" disabled={busy} onClick={() => action(store.logout)}><LogOut size={16} />Sign out</button></aside>
  <div className="customer-content">{error && <p className="commerce-error" role="alert">{error}</p>}{message && <p className="commerce-success" role="status">{message}</p>}
   {tab === 'orders' && <><div className="customer-section-title"><h2>My orders</h2><span>{orders.length} orders</span></div>{loading ? <p role="status">Loading your orders…</p> : !orders.length ? <Empty Icon={ShoppingBag} title="Your first find is waiting" text="Once you place an order, you can track it here." /> : orders.map(order => <article className="customer-order" key={order._id}>
    <div className="order-heading"><div><small>ORDER NUMBER</small><strong>{order.number}</strong></div><div><small>PLACED ON</small><span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span></div><span className="customer-status">{order.status}</span></div>
    {(order.items || []).map((p, i) => <div className="order-item" key={i}><img src={productImage(p)} alt={p.name} /><div><a href={'/product/' + p.productId}>{p.name}</a><p>{p.size ? `Size ${p.size} · ` : ''}Qty {p.qty} · {money(p.unitPrice)}</p></div></div>)}
    <div className="customer-order-footer"><strong>Total {money(order.total)}</strong><span>Cash on delivery · {order.paymentStatus}</span></div>
    <details className="customer-order-details"><summary>Delivery & order details</summary><p>{order.address?.name}, {order.address?.line1}, {order.address?.city}, {order.address?.state} {order.address?.postalCode}</p>{order.trackingNumber && <p>{order.courier} · Tracking: {order.trackingNumber}</p>}{order.returnRequest && <p>Return request: {order.returnRequest.status}</p>}</details>
    {['placed', 'confirmed'].includes(order.status) && <button className="customer-text-action" disabled={busy} onClick={() => { if (confirm('Cancel this order?')) action(async () => { await api('/orders/' + order._id + '/cancel', { method: 'POST' }); await load(); await store.refreshBag(); setMessage('Order cancelled.'); }); }}>Cancel order</button>}
    {order.status === 'delivered' && !order.returnRequest && <details className="customer-order-details"><summary>Request a return</summary><form className="commerce-form" onSubmit={e => { e.preventDefault(); const reason = new FormData(e.currentTarget).get('reason'); action(async () => { await api('/orders/' + order._id + '/return', { method: 'POST', body: { reason } }); await load(); setMessage('Return request submitted.'); }); }}><label>Reason for return<textarea name="reason" minLength={10} maxLength={1000} required /></label><button className="secondary" disabled={busy}>Submit return request</button></form></details>}
   </article>)}</>}
   {tab === 'wishlist' && <><div className="customer-section-title"><h2>My wishlist</h2><span>{saved.length} saved items</span></div>{!saved.length ? <Empty Icon={Heart} title="Keep your favourites close" text="Tap the heart on any product to save it here." /> : <div className="customer-wishlist">{saved.map(p => <article key={p.id}><a href={'/product/' + p.id}><img src={productImage(p)} alt={p.name} /><h3>{p.name}</h3></a><p>{money(p.price)}</p><div><a href={'/product/' + p.id}>View product <ArrowRight size={13} /></a><button disabled={busy} aria-label={'Remove ' + p.name + ' from wishlist'} onClick={() => action(() => store.setWish(ids => ids.filter(id => id !== p.id)))}>Remove</button></div></article>)}</div>}</>}
   {tab === 'profile' && <><div className="customer-section-title"><h2>Profile details</h2></div><p className="customer-helper">Keep your details up to date for your next order.</p><form className="commerce-form customer-profile-form" onSubmit={e => { e.preventDefault(); const fields = Object.fromEntries(new FormData(e.currentTarget)); action(async () => { await updateProfile(fields); setMessage('Profile updated.'); }); }}><label>Full name<input name="name" defaultValue={store.user.name} minLength={2} maxLength={100} required /></label><label>Email address<input type="email" value={store.user.email} readOnly /><small>Your account email cannot be changed here.</small></label><label>Mobile number<input name="phone" type="tel" defaultValue={store.user.phone || ''} maxLength={10} pattern="[6-9][0-9]{9}" /></label><button className="primary" disabled={busy}>Save changes</button></form></>}
   {tab === 'addresses' && <><div className="customer-section-title"><h2>Saved addresses</h2>{addresses.length < 5 && <button className="secondary" onClick={() => setAddressEdit(-1)}>Add address</button>}</div>
    {addressEdit !== null ? <form key={addressEdit} className="commerce-form customer-address-form" onSubmit={e => { e.preventDefault(); const address = { ...Object.fromEntries(new FormData(e.currentTarget)), country: 'India' }; action(async () => { const next = [...addresses]; if (addressEdit === -1) next.push(address); else next[addressEdit] = address; await updateProfile({ addresses: next }); setAddressEdit(null); setMessage('Address saved.'); }); }}><AddressFields initial={addressEdit === -1 ? { name: store.user.name, phone: store.user.phone } : addresses[addressEdit]} /><div className="address-actions"><button className="primary" disabled={busy}>Save address</button><button type="button" className="secondary" onClick={() => setAddressEdit(null)}>Cancel</button></div></form> : <div className="customer-addresses">{!addresses.length && <p className="customer-helper">Save an address for faster checkout.</p>}{addresses.map((a, i) => <article key={i}><MapPin size={18} /><h3>{a.name}</h3><p>{a.line1}<br />{a.line2}{a.line2 && <br />}{a.city}, {a.state} – {a.postalCode}</p><p>{a.phone}</p><div><button onClick={() => setAddressEdit(i)}>Edit</button><button disabled={busy} onClick={() => { if (confirm('Delete this saved address?')) action(async () => { await updateProfile({ addresses: addresses.filter((_, index) => index !== i) }); setMessage('Address removed.'); }); }}>Delete</button></div></article>)}</div>}
   </>}
  </div></div>
 </section>;
}
function Empty({ Icon, title, text }) { return <div className="customer-empty"><span><Icon size={25} strokeWidth={1.4} /></span><h3>{title}</h3><p>{text}</p><a className="primary" href="/collections/all">Explore the collection <ArrowRight size={15} /></a></div>; }
