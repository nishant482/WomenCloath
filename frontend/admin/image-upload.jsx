import React,{useRef,useState} from 'react';
import {ImagePlus,Upload,CheckCircle2} from 'lucide-react';
import './image-upload.css';
export function ImageUpload({value,onChange,enabled,onBusyChange,banner=false}){
 const input=useRef(null),pending=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function upload(e){
  const file=e.target.files?.[0];e.target.value='';
  if(!file||pending.current)return;
  setError('');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Choose a JPG, PNG or WebP image.');return;}
  if(file.size>3*1024*1024){setError('Choose an image smaller than 3 MB.');return;}
  pending.current=true;setBusy(true);onBusyChange(true);
  try{
   const response=await fetch('/api/admin/uploads',{method:'POST',credentials:'same-origin',headers:{'Content-Type':file.type,'X-Requested-With':'RajoStore','X-File-Name':encodeURIComponent(file.name)},body:file});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Image upload failed. Please try again.');
   if(!data.url)throw Error('Image upload failed. Please try again.');
   onChange(data.url);
  }catch(e){setError(e.message||'Image upload failed. Please try again.');}
  finally{pending.current=false;setBusy(false);onBusyChange(false);}
 }
 return <section className={'simple-image-upload '+(banner?'banner-image-upload':'')} aria-label="Image upload">
  <div className="simple-image-title"><h3>{banner?'Banner image':'Image'}</h3>{value&&!busy&&<span><CheckCircle2 size={14}/>Image ready</span>}</div>
  <input ref={input} type="file" aria-label="Upload image" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={!enabled||busy} hidden/>
  {value?<div className="simple-image-preview"><img src={value} alt="Selected image preview" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src='/images/placeholder.svg';}}/></div>:<button type="button" className="simple-image-empty" onClick={()=>input.current.click()} disabled={!enabled||busy}><ImagePlus size={32}/><strong>{busy?'Uploading…':'Choose an image'}</strong><span>{banner?'One image for desktop, tablet and mobile':'Upload directly from your device'}</span></button>}
  <div className="simple-image-actions">{value&&<button type="button" className="secondary" disabled={!enabled||busy} onClick={()=>input.current.click()}><Upload size={15}/>{busy?'Uploading…':'Replace image'}</button>}<small role="status">{busy?'Please wait — your image is uploading.':!enabled?'Image uploads are unavailable for this account.':'JPG, PNG or WebP · Up to 3 MB'}</small></div>
  {error&&<p className="commerce-error" role="alert">{error}</p>}
 </section>;
}
