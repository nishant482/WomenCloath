import React, { useEffect, useState } from 'react';
import { api } from '../src/api.js';
export function MediaLibrary({ onSelect }) {
  const [items, setItems] = useState([]), [query, setQuery] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const load = async () => { try { setItems((await api('/admin/media')).items); } catch(e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  return <section className="media-library"><div className="classic-panel-title"><div><h2>Image library</h2><p>Upload once, reuse across products, banners and family photos.</p></div><label className="secondary">{busy ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Choose an image smaller than 3 MB.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/uploads', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': file.type, 'X-Requested-With': 'RajoStore', 'X-File-Name': encodeURIComponent(file.name) }, body: file });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      await load(); if (onSelect) onSelect(data.url);
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  }} /></label></div>
  <input aria-label="Search images" placeholder="Search by image name…" value={query} onChange={e => setQuery(e.target.value)} />
  {error && <p className="commerce-error" role="alert">{error}</p>}
  <div className="media-grid">{items.filter(item => (item.label || item.originalPath || '').toLowerCase().includes(query.toLowerCase())).map(item => <article key={item._id}><img src={item.url} alt={item.label || 'Library image'} loading="lazy" /><input aria-label="Image name" defaultValue={item.label || item.originalPath || 'Image'} onBlur={async e => { if (!e.target.value.trim()) return; try { await api('/admin/media/' + item._id, { method: 'PATCH', body: { label: e.target.value } }); await load(); } catch(e) { setError(e.message); } }} /><small>{item.provider === 'r2' ? 'Cloudflare R2' : 'Image storage'}</small><div>{onSelect ? <button type="button" className="primary" onClick={() => onSelect(item.url)}>Use image</button> : <button type="button" className="secondary" onClick={async () => { try { await navigator.clipboard.writeText(item.url); } catch { setError('Open the image and copy its address.'); } }}>Copy URL</button>}<a href={item.url} target="_blank" rel="noreferrer">Open</a></div></article>)}</div>
  {!items.length && <p>Your uploaded images will appear here.</p>}</section>;
}
