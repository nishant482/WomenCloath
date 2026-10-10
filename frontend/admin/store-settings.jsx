import React,{useEffect,useState} from 'react';
import {api} from '../src/api.js';
const fields={
 cod:[['codEnabled','Enable cash on delivery','checkbox'],['codFee','Extra COD charge (INR)','number']],
 shipping:[['shippingMode','Shipping mode','select'],['shippingFee','Shipping fee (INR)','number'],['freeShippingAbove','Free shipping above (INR)','number'],['shippingPolicy','Shipping policy','textarea']],
 settings:[['storeName','Store name','text'],['contactEmail','Contact email','email'],['returnPolicy','Return policy','textarea']]
};
export function StoreSettings({page}){
 const [values,setValues]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;api('/admin/settings').then(v=>{if(active)setValues(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 async function save(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{const body=Object.fromEntries(fields[page].map(([key,,type])=>[key,type==='number'?Number(values[key]):type==='checkbox'?Boolean(values[key]):values[key]||'']));await api('/admin/settings',{method:'PATCH',body});setNotice(page==='cod'?`Cash on delivery ${body.codEnabled?'enabled':'disabled'}.`:'Settings saved.');}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="classic-panel settings-panel">
 {page==='cod'&&<p>Enable or disable cash on delivery at checkout. The extra COD charge is separate from shipping. Disabling COD hides it at checkout. Online payment remains available when enabled in Payment gateway.</p>}
 {page==='shipping'&&<p>Choose free shipping, a fixed shipping fee, or free shipping above your chosen order value. COD charges are managed separately.</p>}
 {error&&<p className="commerce-error" role="alert">{error}</p>}{notice&&<p className="commerce-success" role="status">{notice}</p>}
 {!values?<p role="status">Loading settings...</p>:<form className="commerce-form" onSubmit={save}><fieldset disabled={busy} style={{border:0,padding:0,margin:0,display:'contents'}}>{fields[page].map(([key,label,type])=><label key={key}>{label}{type==='checkbox'?<input type="checkbox" checked={Boolean(values[key])} onChange={e=>setValues({...values,[key]:e.target.checked})}/>:type==='select'?<select value={values[key]} onChange={e=>setValues({...values,[key]:e.target.value})}><option value="free">Free shipping</option><option value="paid">Paid shipping</option><option value="threshold">Free above order value</option></select>:type==='textarea'?<textarea rows={5} value={values[key]||''} onChange={e=>setValues({...values,[key]:e.target.value})}/>:<input type={type} min={type==='number'?0:undefined} max={type==='number'?(key==='freeShippingAbove'?1000000:10000):undefined} step={type==='number'?'0.01':undefined} required value={values[key]??''} onChange={e=>setValues({...values,[key]:e.target.value})}/>}</label>)}<button className="primary" type="submit">{busy?'Saving...':'Save changes'}</button></fieldset></form>}
 </section>;
}
