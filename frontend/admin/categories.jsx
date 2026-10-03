import React,{useState,useEffect} from 'react';
import {api} from '../src/api.js';
export function Categories(){
 const [items,setItems]=useState([]),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const load=()=>api('/admin/categories').then(r=>setItems(r.items)).catch(e=>setError(e.message));
 useEffect(()=>{load();},[]);
 async function add(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{await api('/admin/categories',{method:'POST',body:{name}});setName('');setNotice('Category added. You can select it when adding or editing a product.');await load();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="classic-panel settings-panel"><h2>Product categories</h2><form className="commerce-form" onSubmit={add}><label>Category name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Dresses" minLength={2} maxLength={50} required /></label><button className="primary" disabled={busy}>{busy?'Adding…':'Add category'}</button></form>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}<div className="studio-table-wrap"><table><thead><tr><th>Category</th><th>Products</th><th>Units in stock</th><th>Store collection</th></tr></thead><tbody>{items.map(c=><tr key={c.slug}><td>{c.name}</td><td>{c.products}</td><td>{c.stock}</td><td><a href={'/collections/'+c.slug} target="_blank" rel="noreferrer">View collection</a></td></tr>)}</tbody></table></div></section>;
}
