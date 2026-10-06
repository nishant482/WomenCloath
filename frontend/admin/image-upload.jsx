import React,{useRef,useState,useEffect} from 'react';
import {ImagePlus,Upload,CheckCircle2} from 'lucide-react';
import './image-upload.css';
export function ImageUpload({value,onChange,enabled,onBusyChange,banner=false}){
 const input=useRef(null),pending=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const request=useRef(null),preview=useRef(null),blob=useRef(''),[localPreview,setLocalPreview]=useState(''),[imageLoading,setImageLoading]=useState(true),[imageFailed,setImageFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>()=>{request.current?.abort();if(blob.current)URL.revokeObjectURL(blob.current);},[]);
 useEffect(()=>{setImageLoading(!(preview.current?.complete&&preview.current?.naturalWidth));setImageFailed(false);const timer=setTimeout(()=>{if(!preview.current?.naturalWidth){setImageLoading(false);setImageFailed(true);}},20000);return()=>clearTimeout(timer);},[value,localPreview,retry]);
 async function upload(e){
  const file=e.target.files?.[0];e.target.value='';
  if(!file||pending.current)return;
  setError('');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Choose a JPG, PNG or WebP image.');return;}
  if(file.size>3*1024*1024){setError('Choose an image smaller than 3 MB.');return;}
  pending.current=true;setBusy(true);onBusyChange(true);
  if(blob.current)URL.revokeObjectURL(blob.current);blob.current=URL.createObjectURL(file);setLocalPreview(blob.current);
  const abort=new AbortController();request.current=abort;const timeout=setTimeout(()=>abort.abort(),45000);
  try{
   const response=await fetch('/api/admin/uploads',{method:'POST',credentials:'same-origin',signal:abort.signal,headers:{'Content-Type':file.type,'X-Requested-With':'RajoStore','X-File-Name':encodeURIComponent(file.name)},body:file});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Image upload failed. Please try again.');
   if(!data.url)throw Error('Image upload failed. Please try again.');
   onChange(data.url);
  }catch(e){setError(e.name==='AbortError'?'Upload stopped. Check your connection and choose the image again.':e.message||'Image upload failed. Please try again.');setLocalPreview('');if(blob.current){URL.revokeObjectURL(blob.current);blob.current='';}}
  finally{clearTimeout(timeout);request.current=null;pending.current=false;setBusy(false);onBusyChange(false);}
 }
 return <section className={'simple-image-upload '+(banner?'banner-image-upload':'')} aria-label="Image upload">
  <div className="simple-image-title"><h3>{banner?'Banner image':'Image'}</h3>{value&&!busy&&!imageLoading&&!imageFailed&&<span><CheckCircle2 size={14}/>Image ready</span>}</div>
  <input ref={input} type="file" aria-label="Upload image" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={!enabled||busy} hidden/>
  {(localPreview||value)?<div className="simple-image-preview">{!imageFailed&&<img ref={preview} key={retry} src={localPreview||value} alt="Selected image preview" onLoad={()=>setImageLoading(false)} onError={()=>{setImageLoading(false);setImageFailed(true);}}/>}{imageFailed?<div className="image-preview-message"><span>Preview could not load. Your saved image has not changed.</span><button type="button" className="secondary" onClick={()=>setRetry(n=>n+1)}>Retry preview</button></div>:imageLoading&&<span className="image-preview-message" role="status">Loading preview…</span>}</div>:<button type="button" className="simple-image-empty" onClick={()=>input.current.click()} disabled={!enabled||busy}><ImagePlus size={32}/><strong>{busy?'Uploading…':'Choose an image'}</strong><span>{banner?'One image for desktop, tablet and mobile':'Upload directly from your device'}</span></button>}
  <div className="simple-image-actions">{value&&<button type="button" className="secondary" disabled={!enabled||busy} onClick={()=>input.current.click()}><Upload size={15}/>{busy?'Uploading…':'Replace image'}</button>}<small role="status">{busy?'Please wait — your image is uploading.':!enabled?'Image uploads are unavailable for this account.':'JPG, PNG or WebP · Up to 3 MB'}</small></div>
  {busy&&<button type="button" className="secondary" onClick={()=>request.current?.abort()}>Cancel upload</button>}
  <p className="image-size-guide">{banner?'Recommended: 1920 × 800 px. Keep important details in the centre; mobile screens crop the sides.':'Product photos: 1200 × 1600 px (3:4 portrait). Keep a little space around the outfit.'}</p>
  {error&&<p className="commerce-error" role="alert">{error}</p>}
 </section>;
}
