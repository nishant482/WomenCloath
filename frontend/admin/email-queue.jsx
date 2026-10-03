import React,{useEffect,useState} from 'react';
import {api} from '../src/api.js';
export function EmailQueue(){
 const [data,setData]=useState(null),[error,setError]=useState('');
 const load=()=>api('/admin/email-queue').then(setData).catch(e=>setError(e.message));
 useEffect(()=>{load();},[]);
 return <section className="classic-panel" style={{padding:24}}><h2>New-product email notifications</h2><p>From: info.rajothreads@gmail.com</p><p>{data?.ready?'Automatic delivery is configured. New products are queued on first publication.':'Delivery paused: configure the sender’s Gmail App Password. Products can still be saved and queued.'}</p><p>Checks run every 15 minutes, in small batches, with a maximum of 100 notification attempts per 24 hours. Unsubscribed and blocked customers are skipped.</p><button className="secondary" onClick={load}>Refresh status</button>{error&&<p role="alert">{error}</p>}<div className="compact-stats">{['pending','sent','failed','skipped'].map(status=><article key={status}><span>{status}</span><strong>{data?.counts.find(r=>r._id===status)?.count||0}</strong></article>)}</div><div className="studio-table-wrap"><table><thead><tr><th>Product</th><th>Status</th><th>Created</th><th>Delivery note</th></tr></thead><tbody>{data?.items.map(row=><tr key={row._id}><td>#{row.productId}</td><td>{row.status}</td><td>{new Date(row.createdAt).toLocaleDateString('en-IN')}</td><td>{row.error||'—'}</td></tr>)}</tbody></table></div><p>Failed or interrupted deliveries are held for review; saving a product again does not resend it.</p></section>;
}
