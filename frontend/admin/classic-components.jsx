import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X, Package, ShoppingBag, Users, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthForm } from '../src/account.jsx';
import { api, productImage } from '../src/api.js';
export const money = value => '₹' + Number(value || 0).toLocaleString('en-IN');
export const dateText = value => value ? new Date(value).toLocaleDateString('en-IN') : '—';
export function CustomerShopping({ userId }) {
  const [data, setData] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController(); setData(null); setError('');
    api('/admin/users/' + userId + '/shopping', { signal: abort.signal }).then(r => { if (!abort.signal.aborted) setData(r); }).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, [userId]);
  if (error) return <p className="commerce-error" role="alert">{error}</p>;
  if (!data) return <p role="status">Loading customer cart and wishlist…</p>;
  return <div className="admin-customer-shopping">{[['cart', 'Shopping cart'], ['wishlist', 'Wishlist']].map(([key, title]) => <section key={key}>
    <h4>{title} <span>({data[key].length} items)</span></h4>
    {!data[key].length ? <p>No items saved.</p> : <div className="compact-table-scroll" tabIndex={0}><table className="compact-table"><thead><tr><th>Product</th>{key === 'cart' && <><th>Size</th><th>Qty</th></>}<th>Price</th><th>Status</th></tr></thead><tbody>{data[key].map((p, i) => <tr key={p.id + '-' + i}><td><div className="shopping-product"><img src={productImage(p)} alt="" /><span>{p.name}</span></div></td>{key === 'cart' && <><td>{p.size || 'Free size'}</td><td>{p.qty}</td></>}<td>{money(key === 'cart' ? p.lineTotal : p.price)}</td><td><Status value={p.status} /></td></tr>)}</tbody></table></div>}
    {key === 'cart' && data.cart.length > 0 && <p className="shopping-total">Current cart total: <strong>{money(data.cart.reduce((n, p) => n + p.lineTotal, 0))}</strong></p>}
  </section>)}<small>Current saved items for this signed-in customer. Prices reflect the current catalogue.</small></div>;
}
export function Status({ value }) { return <span className="status-pill" data-status={value}>{value || '—'}</span>; }

export function ClassicLogin({ error, onLogin }) {
  return <main className="classic-login">
    <div className="classic-login-shell">
    <aside className="classic-login-visual" aria-label="RAJO Threads collection">
      <img src="/images/terracotta.jpg" alt="An outfit from the RAJO Threads ethnic wear collection" />
      <div><span>RAJO THREADS</span><h2>Every detail,<br />beautifully managed.</h2><p>Your collections. Your customers. Your store.</p></div>
    </aside>
    <section className="classic-login-card">
      <div className="classic-login-brand"><img src="/images/rajo-threads-logo.jpeg" alt="RAJO Threads" /><div><strong>RAJO Threads</strong><span>ADMINISTRATION</span></div></div>
      {error && <p className="commerce-error" role="alert">{error}</p>}
      <AuthForm admin onLogin={onLogin} />
      <a className="login-store-link" href="/">Back to storefront <ArrowUpRight size={13} /></a>
    </section>
    </div>
  </main>;
}

export function RecordDialog({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="studio-dialog classic-detail-dialog" aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="studio-dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close details" onClick={onClose}><X size={18} /></button></div>
    {children}
  </dialog>;
}

export function ProductDetail({ product: p, onEdit }) {
  return <><div className="product-detail-layout"><img src={productImage(p)} alt={p.name} /><div>
    <Status value={p.status} /><h3>{p.name}</h3><p className="detail-price">{money(p.price)} {p.old > 0 && <del>{money(p.old)}</del>}</p>
    <dl className="detail-grid">{[['Product ID', p.id], ['SKU', p.sku], ['Category', p.category], ['Fabric', p.fabric], ['Stock', `${p.stock} units`], ['Sizes', p.sizes?.join(', ') || 'Free size'], ['Colour', p.colour || p.color], ['Label', p.tag || '—']].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
    </div></div><h4>Description</h4><p className="preserve-lines">{p.description || 'No description added.'}</p>
    <div className="detail-actions"><button className="primary" onClick={onEdit}>Edit product</button>{p.status === 'active' && <a className="secondary" href={`/#/product/${p.id}`} target="_blank" rel="noreferrer">View in store <ArrowUpRight size={14} /></a>}</div></>;
}

export function Pagination({ total, current, onChange }) {
  const pages = Math.max(1, Math.ceil(total / 10));
  const numbers = [...new Set([1, current - 1, current, current + 1, pages])].filter(n => n > 0 && n <= pages).sort((a, b) => a - b);
  return <div className="table-pagination"><span>{total ? (current - 1) * 10 + 1 : 0}–{Math.min(current * 10, total)} of {total} records <small> · 10 per page</small></span>
    <nav aria-label="Table pagination"><button aria-label="Previous page" disabled={current === 1} onClick={() => onChange(current - 1)}><ChevronLeft size={15} /></button>
    {numbers.map((n, i) => <React.Fragment key={n}>{i > 0 && n - numbers[i - 1] > 1 && <span>…</span>}<button aria-label={`Page ${n}`} aria-current={current === n ? 'page' : undefined} onClick={() => onChange(n)}>{n}</button></React.Fragment>)}
    <button aria-label="Next page" disabled={current === pages} onClick={() => onChange(current + 1)}><ChevronRight size={15} /></button></nav></div>;
}

function SalesChart({ rows, metric }) {
  const max = Math.max(3, Math.ceil(Math.max(0, ...rows.map(r => r[metric])) / 3) * 3);
  const width = 660, height = 160, step = 580 / Math.max(rows.length, 1);
  return <svg className="sales-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric === 'revenue' ? 'Collected revenue in rupees' : 'Order count'} by day, ${rows.length} days, India time`}>
    {[0, 1, 2, 3].map(i => <g key={i}><line x1="60" x2="646" y1={20 + i * 36} y2={20 + i * 36} stroke="#ece7e5" /><text x="49" y={24 + i * 36} textAnchor="end">{Math.round(max * (3 - i) / 3).toLocaleString('en-IN')}</text></g>)}
    {rows.map((r, i) => <g key={r.date}><rect x={65 + i * step} y={128 - (r[metric] / max) * 108} width={Math.max(3, step * .5)} height={(r[metric] / max) * 108} rx="2" fill="#891c20"><title>{r.date}: {metric === 'revenue' ? money(r.revenue) : `${r.orders} orders`}</title></rect>{(rows.length <= 7 || i % 5 === 0 || i === rows.length - 1) && <text x={65 + i * step + step * .25} y="151" textAnchor="middle">{r.date.slice(8)}/{r.date.slice(5, 7)}</text>}</g>)}
    {!rows.some(r => r[metric]) && <text x="352" y="80" textAnchor="middle" className="chart-empty">No {metric === 'revenue' ? 'collected revenue' : 'orders'} in this period</text>}
  </svg>;
}

export function ClassicDashboard({ overview, reports = false }) {
  const [days, setDays] = useState(7), [metric, setMetric] = useState('revenue');
  const rows = (overview.dailySales || []).slice(-days);
  const statuses = overview.orderStatuses || [];
  const total = statuses.reduce((n, row) => n + row.count, 0);
  return <div className="classic-dashboard">
    <div className="compact-stats">{[
      ['Collected revenue', money(overview.revenue), Wallet, 'All paid orders'],
      ['Orders', overview.orders || 0, ShoppingBag, `${overview.pendingOrders || 0} awaiting fulfilment`],
      ['Products', overview.products || 0, Package, `${overview.lowStock || 0} low in stock`],
      ['Customers', overview.users || 0, Users, 'Active and blocked accounts'],
    ].map(([label, value, Icon, note]) => <article key={label}><div><span>{label}</span><Icon size={17} /></div><strong>{value}</strong><small>{note}</small></article>)}</div>
    <div className="dashboard-charts"><section className="classic-panel"><div className="classic-panel-title"><h2>Sales overview</h2><div><select aria-label="Chart metric" value={metric} onChange={e => setMetric(e.target.value)}><option value="revenue">Collected revenue</option><option value="orders">Orders</option></select><select aria-label="Chart period" value={days} onChange={e => setDays(Number(e.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></div></div><SalesChart rows={rows} metric={metric} /><p className="chart-footnote">{rows.reduce((sum, r) => sum + r.orders, 0)} orders · {money(rows.reduce((sum, r) => sum + r.revenue, 0))} collected · India time</p></section>
    <section className="classic-panel"><div className="classic-panel-title"><h2>Order status</h2><span>{total} total</span></div><div className="status-chart">{['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'].map(status => { const count = statuses.find(r => r._id === status)?.count || 0; return <div key={status}><span>{status}</span><meter min="0" max={Math.max(total, 1)} value={count} aria-label={`${status}: ${count} orders`} /><b>{count}</b></div>; })}</div></section></div>
    <div className="dashboard-bottom"><section className="classic-panel"><div className="classic-panel-title"><h2>Recent orders</h2><a href="#orders">View orders ↗</a></div><div className="compact-table-scroll" tabIndex={0}><table className="compact-table"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>{(overview.recentOrders || []).map(r => <tr key={r._id}><td><a href="#orders">{r.number}</a></td><td>{r.customer}</td><td>{money(r.total)}</td><td><Status value={r.status} /></td></tr>)}</tbody></table>{!overview.recentOrders?.length && <p className="table-empty">No orders yet. New orders will appear here.</p>}</div></section>
    <section className="classic-panel"><div className="classic-panel-title"><h2>Store activity</h2></div><div className="dashboard-tasks"><a href="#inventory"><span>Low-stock products</span><b>{overview.lowStock || 0} →</b></a><a href="#reviews"><span>Reviews to approve</span><b>{overview.pendingReviews || 0} →</b></a><a href="#orders"><span>Orders to prepare</span><b>{overview.pendingOrders || 0} →</b></a><a href="#products"><span>Manage products</span><b>→</b></a></div></section></div>
    {reports && <section className="classic-panel"><div className="classic-panel-title"><h2>Category performance</h2><span>Current catalogue</span></div><table className="compact-table"><thead><tr><th>Category</th><th>Products</th><th>Units in stock</th></tr></thead><tbody>{(overview.categories || []).map(r => <tr key={r._id}><td>{r._id}</td><td>{r.products}</td><td>{r.stock}</td></tr>)}</tbody></table></section>}
  </div>;
}
