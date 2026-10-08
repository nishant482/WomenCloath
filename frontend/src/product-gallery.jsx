import React,{useState,useRef} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {productImages} from './product-images.js';
export function ProductGallery({product}){
 const images=productImages(product),photos=images.length?images:['/images/placeholder.svg'];
 const [selected,setSelected]=useState(0),[failed,setFailed]=useState('');const touch=useRef(null);
 const current=selected%photos.length,url=photos[current];
 const move=step=>setSelected(index=>(index+step+photos.length)%photos.length);
 return <div className="product-gallery product-multi-gallery" aria-label="Product photos">
  <div className="product-gallery-stage" onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)&&photos.length>1)move(dx<0?1:-1);touch.current=null;}}>
   <img src={failed===url?'/images/placeholder.svg':url} alt={`${product.name} — photo ${current+1}`} width="1200" height="1600" onError={()=>setFailed(url)}/>
   {product.tag&&<span className="product-gallery-tag">{product.tag}</span>}
   {photos.length>1&&<><button className="gallery-previous" type="button" aria-label="Previous product photo" onClick={()=>move(-1)}><ChevronLeft size={20}/></button><button className="gallery-next" type="button" aria-label="Next product photo" onClick={()=>move(1)}><ChevronRight size={20}/></button><span className="gallery-count" aria-live="polite">{current+1} / {photos.length}</span></>}
  </div>
  {photos.length>1&&<div className="product-gallery-thumbnails" aria-label="Choose product photo">{photos.map((image,index)=><button key={image} type="button" aria-label={`Show product photo ${index+1}`} aria-pressed={current===index} onClick={()=>setSelected(index)}><img src={image} alt="" width="90" height="120" loading="lazy"/></button>)}</div>}
 </div>;
}
