import {AdminProfile} from './admin-profile.jsx';
import {StoreSettings} from './store-settings.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, Star, Image, FileText, TicketPercent, Settings, Mail, LogOut, Plus, Menu, X, ArrowUpRight, RefreshCw, Boxes, Layers, RotateCcw, Wallet, BarChart3, Download, Eye, Pencil, Trash2 } from 'lucide-react';
import { api, productImage } from '../src/api.js';
import { RecordEditor, OrderDetails } from './admin-editors.jsx';
import { Categories } from './categories.jsx';
import { AdminAccess } from './admin-access.jsx';
import { EmailQueue } from './email-queue.jsx';
import { ClassicLogin, ClassicDashboard, RecordDialog, ProductDetail, Pagination, Status, money, dateText, CustomerShopping } from './classic-components.jsx';
const navigation = [
 ['overview', 'Overview', LayoutDashboard, 'WORKSPACE'],
 ['products', 'Products & inventory', Package, 'CATALOGUE'], ['categories', 'Categories', Layers],
 ['orders', 'Orders', ShoppingBag, 'SALES'],
 ['payments', 'Payments', Wallet], ['users', 'Users', Users],
 ['carts', 'Customer carts', ShoppingBag], ['wishlists', 'Customer wishlists', Star],
 ['reviews', 'Reviews', Star, 'CONTENT'], ['banners', 'Banners', Image], ['family', 'RAJO family', Image],
 ['blogs', 'Blog posts', FileText],
 ['coupons', 'Discount codes', TicketPercent, 'MANAGEMENT'],
 ['enquiries', 'Customer enquiries', Mail, 'MANAGEMENT'],
 ['email-queue', 'Email notifications', Mail],
 ['cod', 'Cash on Delivery', Wallet],
 ['shipping', 'Shipping', Package],
 ['settings', 'Store settings', Settings],
 ['access', 'Admin access', Users],
 ['profile','My profile',Users],
];
const kinds = { banners: 'banner', family: 'family', blogs: 'blog' };
const resourceFor = page => ({ inventory: 'products', categories: 'products', returns: 'orders', payments: 'orders', carts: 'users', wishlists: 'users' }[page] || (kinds[page] ? 'content' : page));
const moduleFor = page => ({cod:'settings',shipping:'settings',reports:'overview',inventory:'products',categories:'products',returns:'orders',payments:'orders',carts:'users',wishlists:'users'}[page] || page);
const route = () => location.hash === '#inventory' ? 'products' : navigation.some(n => n[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
const recordName = r => r.name || r.title || r.number || r.code || r.email || 'Record';
export default function ClassicAdminApp() {
 const [user, setUser] = useState(null), [checking, setChecking] = useState(true), [page, setPage] = useState(route);
 const [result, setResult] = useState({ page: '', data: [] }), [overview, setOverview] = useState({}), [loading, setLoading] = useState(true);
 const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
 const [query, setQuery] = useState(''), [status, setStatus] = useState('all'), [sort, setSort] = useState('newest'), [current, setCurrent] = useState(1);
 const [editor, setEditor] = useState(null), [view, setView] = useState(null), [mobile, setMobile] = useState(false);
 const allowed = key => key === 'profile' || user?.isOwner || (key !== 'access' && user?.adminPermissions?.includes(moduleFor(key)));
 const allowedNavigation = navigation.filter(([key])=>allowed(key));
 const request = useRef(0), controller = useRef(null);
 const resource = resourceFor(page), dashboard = ['overview', 'reports'].includes(page);
 useEffect(() => {
  let active = true;
  api('/auth/me').then(r => { if (active && r.user.role === 'admin') setUser(r.user); }).catch(e => { if (active && e.status !== 401) setError(e.message); }).finally(() => { if (active) setChecking(false); });
  const change = () => { controller.current?.abort(); request.current++; setPage(route()); setQuery(''); setStatus('all'); setSort('newest'); setCurrent(1); setEditor(null); setView(null); setMobile(false); setNotice(''); };
  window.addEventListener('hashchange', change);
  return () => { active = false; controller.current?.abort(); window.removeEventListener('hashchange', change); };
 }, []);
 const load = async () => {
  const id = ++request.current;
  controller.current?.abort();
  const abort = new AbortController(); controller.current = abort;
  setLoading(true); setError('');
  try {
   if(!allowed(page)) {setResult({page,data:[]});return;}
   const [summary, response] = await Promise.all([dashboard && allowed('overview') ? api('/admin/overview', { signal: abort.signal }) : Promise.resolve(overview), dashboard || ['access','email-queue','media','categories','cod','shipping','settings','profile'].includes(page) ? Promise.resolve({items:[]}) : api('/admin/' + resource + (page === 'payments' ? '?view=payments' : ''), { signal: abort.signal })]);
   if (id !== request.current || abort.signal.aborted) return;
   setOverview(summary); setResult({ page, data: page === 'settings' ? response : response.items || [] });
  } catch (e) {
   if (id !== request.current || abort.signal.aborted) return;
   setError(e.message); setResult({ page, data: [] });
   if (e.status === 401) setUser(null);
  } finally { if (id === request.current && !abort.signal.aborted) setLoading(false); }
 };
 useEffect(() => { if(user && !allowed(page) && allowedNavigation.length) location.hash=allowedNavigation[0][0]; }, [user,page]);
 useEffect(() => { if (user) load(); return () => controller.current?.abort(); }, [user, page]);
 useEffect(() => { setCurrent(1); }, [query, status, sort]);
 useEffect(() => {
  if (!mobile) return;
  const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
  const escape = e => { if (e.key === 'Escape') setMobile(false); };
  document.addEventListener('keydown', escape);
  return () => { document.body.style.overflow = old; document.removeEventListener('keydown', escape); };
 }, [mobile]);
 const mutate = async (path, method, body) => {
  setBusy(true); setError(''); setNotice('');
  try { await api('/admin/' + path, { method, body }); setView(null); setNotice(method === 'DELETE' ? resource === 'orders' ? 'Order and payment entry removed from the admin lists. Customer history is preserved.' : 'Record deleted. Existing order history is preserved.' : 'Changes saved.'); await load(); }
  catch (e) { setError(e.message); }
  finally { setBusy(false); }
 };
 const remove = r => {
  const extra = resource === 'orders' ? 'This removes the linked order and payment entry from both admin lists. It does not cancel delivery, restore stock or issue a refund. Customer history is preserved.' : resource === 'users' ? 'This removes the account from Users and disables login. Existing order records are retained.' : resource === 'products' ? 'This removes the product from the catalogue and storefront. Existing orders are retained.' : 'This cannot be undone.';
  if (window.confirm(`Delete “${recordName(r)}”?\n\n${extra}`)) mutate(`${resource}/${resource === 'products' ? r.id : r._id}`, 'DELETE');
 };
 if (checking) return <main className="commerce-status"><p role="status">Opening admin panel…</p></main>;
 if (!user) return <ClassicLogin error={error} onLogin={u => { setError(''); setUser(u); }} />;
 const ready = !loading && result.page === page;
 const data = result.page === page ? result.data : [];
 let records = Array.isArray(data) ? data : [];
 if (kinds[page]) records = records.filter(r => r.kind === kinds[page]);
 if (page === 'returns') records = records.filter(r => r.returnRequest || r.status === 'returned');
 if (page === 'carts') records = records.filter(r => r.cartCount > 0);
 if (page === 'wishlists') records = records.filter(r => r.wishlistCount > 0);
 if (page === 'categories') records = ['Sarees', 'Lehengas', 'Kurta sets'].map(name => ({ _id: name, name, products: records.filter(p => p.category === name).length, stock: records.filter(p => p.category === name).reduce((n, p) => n + p.stock, 0) }));
 const statuses = [...new Set(records.map(r => page === 'payments' ? r.paymentStatus : r.status || (r.active ? 'active' : 'inactive')))].filter(Boolean);
 let rows = records.filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()) && (status === 'all' || (page === 'payments' ? r.paymentStatus : r.status || (r.active ? 'active' : 'inactive')) === status));
 if (sort === 'name') rows.sort((a, b) => recordName(a).localeCompare(recordName(b)));
 if (sort === 'price') rows.sort((a, b) => (a.price ?? a.total ?? 0) - (b.price ?? b.total ?? 0));
 if (sort === 'stock') rows.sort((a, b) => (a.stock || 0) - (b.stock || 0));
 const currentPage = Math.min(current, Math.max(1, Math.ceil(rows.length / 10)));
 const visible = rows.slice((currentPage - 1) * 10, currentPage * 10);
 const label = navigation.find(n => n[0] === page)?.[1];
 const isProduct = resource === 'products' && page !== 'categories';
 const canEdit = ['products', 'content', 'coupons', 'reviews', 'settings'].includes(resource) && page !== 'categories';
 const editPage = resource === 'products' ? 'products' : page;
 const columns = page === 'categories' ? ['Category', 'Products', 'Units in stock', 'Actions'] : isProduct ? ['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'] : resource === 'orders' ? ['Order', 'Customer', 'Amount', page === 'payments' ? 'Payment' : 'Status', 'Date', 'Actions'] : resource === 'users' ? ['Customer', 'Email / phone', 'Cart / wishlist', 'Status', 'Joined', 'Actions'] : ['Record', 'Details', 'Status', 'Date', 'Actions'];
 const actions = r => <div className="studio-row-actions">
   <button aria-label={`View ${recordName(r)}`} title="View details" onClick={() => setView(r)}><Eye size={14} /> View</button>
   {canEdit && resource !== 'reviews' && <button aria-label={`Edit ${recordName(r)}`} onClick={() => setEditor(r)}><Pencil size={13} /> Edit</button>}
   {resource === 'users' && <>
    {user.isOwner && <select aria-label={'Role for ' + r.email} value={r.role} disabled={busy || r.email === user.email || r.email === 'nishant@gmail.com' || (!user.isOwner && r.role === 'admin')} onChange={e => mutate('users/' + r._id, 'PATCH', { role: e.target.value, status: r.status })}><option>customer</option><option>admin</option></select>}
    <button disabled={busy || r.email === user.email || r.email === 'nishant@gmail.com' || (!user.isOwner && r.role === 'admin')} onClick={() => mutate('users/' + r._id, 'PATCH', { role: r.role, status: r.status === 'active' ? 'blocked' : 'active' })}>{r.status === 'active' ? 'Block' : 'Unblock'}</button>
   </>}
   {resource === 'reviews' && <select aria-label={'Review status: ' + r.title} disabled={busy} value={r.status} onChange={e => mutate('reviews/' + r._id, 'PATCH', { status: e.target.value })}>{['pending', 'draft', 'published', 'rejected'].map(s => <option key={s}>{s}</option>)}</select>}
   {resource === 'enquiries' && <button disabled={busy} onClick={() => mutate('enquiries/' + r._id, 'PATCH', { status: r.status === 'new' ? 'resolved' : 'new' })}>{r.status === 'new' ? 'Mark resolved' : 'Reopen'}</button>}
   {(['products', 'users', 'content', 'coupons', 'reviews'].includes(resource) || ['orders', 'payments'].includes(page)) && page !== 'categories' && <button className="delete-action" aria-label={`Delete ${recordName(r)}`} disabled={busy || (resource === 'users' && (r.email === user.email || r.email === 'nishant@gmail.com' || (!user.isOwner && r.role === 'admin')))} onClick={() => remove(r)}><Trash2 size={13} /> Delete</button>}
 </div>;
 return <div className="studio classic-studio">
  <aside className={'studio-sidebar ' + (mobile ? 'open' : '')}><a href="#overview" className="studio-brand"><img src="https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/0060c684-5752-4474-88b4-99a974a0d976.jpg" alt="RAJO Threads" /><span>RAJO Threads<small>ADMIN PANEL</small></span></a><button className="studio-close icon-button" aria-label="Close navigation" onClick={() => setMobile(false)}><X size={18} /></button>
   <nav aria-label="Studio navigation">{allowedNavigation.map(([key, title, Icon, group]) => <React.Fragment key={key}>{group && <span className="studio-nav-group">{group}</span>}<a href={'#' + key} aria-current={page === key ? 'page' : undefined}><Icon size={16} />{title}</a></React.Fragment>)}</nav>
   <button className="studio-logout" onClick={() => api('/auth/logout', { method: 'POST' }).then(() => setUser(null)).catch(e => setError(e.message))}><LogOut size={15} /> Sign out</button>
  </aside>
  {mobile && <button className="studio-shade" aria-label="Close navigation overlay" onClick={() => setMobile(false)} />}
  <main className="studio-main"><header className="studio-header"><button className="studio-menu icon-button" aria-label="Open navigation" onClick={() => setMobile(true)}><Menu size={19} /></button><div><span className="eyebrow">ADMINISTRATION / {label}</span><h1>{label}</h1></div><div className="admin-header-right"><a href="/" target="_blank" rel="noreferrer">View store <ArrowUpRight size={13} /></a><span className="admin-avatar" title={user.email}>{user.name?.[0] || 'A'}</span></div></header>
   {error && <p className="commerce-error" role="alert">{error} <button onClick={load}>Retry</button></p>}{notice && <p className="commerce-success" role="status">{notice}</p>}
   {!allowed(page) ? <section className="classic-panel settings-panel"><h2>No access assigned</h2><p>Ask Nishant to enable the required admin sections.</p></section> : page === 'profile' ? <AdminProfile onUpdate={setUser}/> : ['cod','shipping','settings'].includes(page) ? <StoreSettings key={page} page={page}/> : page === 'categories' ? <Categories /> : page === 'access' ? <AdminAccess /> : page === 'email-queue' ? <EmailQueue /> : dashboard ? ready ? <ClassicDashboard overview={overview} reports={page === 'reports'} /> : <p className="table-empty" role="status">Loading dashboard…</p> : <>
    <div className="studio-toolbar">{page !== 'settings' && <><input aria-label="Search records" placeholder={`Search ${label.toLowerCase()}…`} value={query} onChange={e => setQuery(e.target.value)} />{page !== 'categories' && <select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select>}<select aria-label="Sort records" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="name">Name A–Z</option>{(isProduct || resource === 'orders') && <option value="price">Amount: low to high</option>}{isProduct && <option value="stock">Stock: low to high</option>}</select></>}
     <button className="secondary" onClick={load} disabled={loading} aria-label="Refresh records"><RefreshCw size={14} /></button>
     {canEdit && <button className="primary" disabled={!ready} onClick={() => setEditor(page === 'settings' ? data : {})}><Plus size={14} />{page === 'settings' ? 'Edit settings' : resource === 'products' ? 'Add product' : page === 'reviews' ? 'Add demo review' : 'Add new'}</button>}
    </div>
    {!ready ? <p className="table-empty" role="status">Loading records…</p> : page === 'settings' ? <section className="classic-panel settings-panel"><h2>{data.storeName}</h2><dl className="detail-grid">{[['Contact email', data.contactEmail || '—'], ['Shipping mode', data.shippingMode], ['Shipping fee', money(data.shippingFee)], ['Extra COD charge', money(data.codFee || 0)], ['Free shipping above', money(data.freeShippingAbove)], ['Cash on delivery', data.codEnabled ? 'Enabled' : 'Disabled']].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><h3>Shipping policy</h3><p className="preserve-lines">{data.shippingPolicy || 'No policy added.'}</p><h3>Return policy</h3><p className="preserve-lines">{data.returnPolicy || 'No policy added.'}</p></section> : <section className="records-panel">
     <div className="table-summary"><strong>{label}</strong><span>{rows.length} records</span>{isProduct && <span>{rows.filter(r => r.stock <= 5).length} low in stock</span>}</div>
     <div className="studio-table-wrap"><table><thead><tr>{columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{visible.map(r => <tr key={r._id || r.id}>
      <td><div className="table-record">{(r.imageUrl || isProduct) && <img className="studio-thumb" src={productImage(r)} alt="" />}<div><strong>{recordName(r)}</strong><small>{isProduct ? r.sku : resource === 'orders' ? (r.items?.length || 0) + ' item(s)' : r.slug || ''}</small></div></div></td>
      {page === 'categories' ? <><td>{r.products}</td><td>{r.stock}</td></> : isProduct ? <><td>{r.category}</td><td>{money(r.price)}</td><td><span className={r.stock <= 5 ? 'stock-low' : ''}>{r.stock} units</span><small>{r.sizes?.join(', ') || 'Free size'}</small></td><td><Status value={r.status} /></td></> : resource === 'orders' ? <><td>{r.customer}<small>{r.email}</small></td><td>{money(r.total)}<small>{r.paymentStatus}</small></td><td><Status value={page === 'payments' ? r.paymentStatus : r.status} />{page === 'returns' && <small>{r.returnRequest?.status || 'returned'}</small>}</td><td>{dateText(r.createdAt)}</td></> : resource === 'users' ? <><td>{r.email}<small>{r.phone || 'No phone added'}</small></td><td>{r.cartCount || 0} cart items<small>{r.wishlistCount || 0} wishlist items ? {r.role}</small></td><td><Status value={r.status} /></td><td>{dateText(r.createdAt)}</td></> : <><td className="table-description">{resource === 'reviews' ? <>{'★'.repeat(r.rating || 0)} · Product {r.productId}<small>{r.isDemo ? 'Demo review' : r.verifiedPurchase ? 'Verified purchase' : 'Customer review'}</small></> : resource === 'coupons' ? <>{r.value}{r.type === 'percentage' ? '%' : ' INR'}<small>Min. {money(r.minimum)} · Expires {dateText(r.expiresAt)}</small></> : resource === 'enquiries' ? <>{r.subject}<small>{r.email}</small></> : r.body?.slice(0, 95) || '—'}</td><td><Status value={r.status || (r.active ? 'active' : 'inactive')} /></td><td>{dateText(r.createdAt)}</td></>}
      <td>{actions(r)}</td>
     </tr>)}</tbody></table>{!visible.length && <p className="table-empty">{query || status !== 'all' ? 'No matching records. Try another search or filter.' : 'No records yet.'}</p>}</div>
     <Pagination total={rows.length} current={currentPage} onChange={setCurrent} />
    </section>}
   </>}
  </main>
  {editor && <RecordEditor key={page + (editor._id || 'new')} page={editPage} record={Object.keys(editor).length ? editor : null} onClose={() => setEditor(null)} onSave={async () => { setNotice('Changes saved.'); await load(); }} uploadsEnabled={allowed('media')} />}
  {view && <RecordDialog title={recordName(view)} onClose={() => setView(null)}>
    {error && <p className="commerce-error" role="alert">{error}</p>}
    {resource === 'users' && <CustomerShopping userId={view._id} />}
    {isProduct ? <ProductDetail product={view} onEdit={() => { setEditor(view); setView(null); }} /> : resource === 'orders' ? <OrderDetails order={view} busy={busy} onUpdate={(id, body) => mutate('orders/' + id, 'PATCH', body)} /> : <><dl className="detail-grid">{(page === 'categories' ? [['Category', view.name], ['Products', view.products], ['Stock', view.stock]] : resource === 'users' ? [['Name', view.name], ['Email', view.email], ['Phone', view.phone || '—'], ['Role', view.role], ['Status', view.status], ['Joined', dateText(view.createdAt)]] : [['Title', recordName(view)], ['Status', view.status || (view.active ? 'active' : 'inactive')], ['Email', view.email || '—'], ['Date', dateText(view.createdAt)]]).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>{view.imageUrl && <img className="content-preview" src={view.imageUrl} alt={view.alt || recordName(view)} />}<p className="preserve-lines">{view.body || view.message || ''}</p>{resource === 'users' && <><h4>Saved addresses</h4>{view.addresses?.length ? view.addresses.map((a, i) => <p key={i}>{a.name} · {a.line1} {a.line2}, {a.city}, {a.state} {a.postalCode}</p>) : <p>No saved addresses.</p>}</>}</>}
  </RecordDialog>}
 </div>;
}
