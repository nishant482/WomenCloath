import React,{useRef,useState,useEffect} from 'react';
import {prepareImage} from './prepare-image.js';
import './product-images.css';
export function ProductImages({value,onChange,enabled,onBusyChange}){
 const input=useRef(null),pending=useRef(false),request=useRef(null),mounted=useRef(true);
 const [busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState('');
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;request.current?.abort();};},[]);
 async function upload(e){
  const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length||pending.current)return;
  setError('');if(value.length+files.length>8){setError('You can add up to 8 images per product.');return;}
  const images=[...value];pending.current=true;setBusy(true);onBusyChange(true);
  try{for(let i=0;i<files.length;i++){
   const controller=new AbortController();request.current=controller;const timer=setTimeout(()=>controller.abort(),45000);
   try{setProgress(`Preparing image ${i+1} of ${files.length}…`);const file=await prepareImage(files[i],false,true);
    if(controller.signal.aborted||!mounted.current)throw new DOMException('Cancelled','AbortError');
    setProgress(`Uploading image ${i+1} of ${files.length}…`);
    const response=await fetch('/api/admin/uploads',{method:'POST',credentials:'same-origin',signal:controller.signal,headers:{'Content-Type':file.type,'X-Requested-With':'RajoStore','X-File-Name':encodeURIComponent(file.name)},body:file});
    let data;try{data=await response.json();}catch{throw Error('Upload failed. Please try again.');}
    if(!response.ok||!data.url)throw Error(data.error||'Upload failed. Please try again.');
    images.push(data.url);if(mounted.current)onChange([...images]);
   }catch(error){throw Error(`${files[i].name}: ${error.name==='AbortError'?'Upload stopped.':error.message} Successfully uploaded photos are kept; select the remaining photos again.`);}finally{clearTimeout(timer);}
  }}catch(error){if(mounted.current)setError(error.message);}finally{request.current=null;pending.current=false;if(mounted.current){setBusy(false);setProgress('');onBusyChange(false);}}
 }
 return <section className="product-image-editor" aria-label="Product images">
  <h3>Product images <small>{value.length} / 8</small></h3>
  <p>Select multiple photos together. Auto-sized to 1200 × 1600 px. The main photo appears on product cards.</p>
  <input hidden ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Upload product images" disabled={!enabled||busy} onChange={upload}/>
  <div className="product-image-grid">{value.map((url,index)=><article key={url}><img src={url} alt={`Product photo ${index+1}`}/><strong>{index===0?'Main photo':`Photo ${index+1}`}</strong><div>{index>0&&<button type="button" disabled={busy||!enabled} onClick={()=>onChange([url,...value.filter(v=>v!==url)])}>Make main</button>}<button type="button" disabled={busy||!enabled} aria-label={`Remove photo ${index+1}`} onClick={()=>onChange(value.filter(v=>v!==url))}>Remove</button></div></article>)}</div>
  <button className="secondary" type="button" disabled={!enabled||busy||value.length>=8} onClick={()=>input.current.click()}>Add photos</button>
  {busy&&<button className="secondary" type="button" onClick={()=>request.current?.abort()}>Cancel upload</button>}
  <p role="status">{progress||(!enabled?'Image uploads are not enabled for this account.':'JPG, PNG or WebP · Up to 20 MB per photo')}</p>
  {error&&<p role="alert" className="commerce-error">{error}</p>}
 </section>;
}
