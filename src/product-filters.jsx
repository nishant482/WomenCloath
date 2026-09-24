import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import './product-filters.css';

export const emptyFilters = { colour: '', fabric: '', price: '' };
const colourNames = { yellow:'Yellow',blue:'Blue',ivory:'Ivory',terracotta:'Terracotta',magenta:'Magenta',emerald:'Green',sharara:'Beige',floral:'Pink',kurta:'Brown',charcoal:'Black',pink:'Pink',purple:'Purple' };
export const colourOf = p => colourNames[p.image];
export const fabricOf = p => p.fabric.split(' · ')[0];
export const priceRanges = [
  {value:'under-3000',label:'Under ₹3,000',min:0,max:2999},
  {value:'3000-6000',label:'₹3,000 – ₹5,999',min:3000,max:5999},
  {value:'6000-9000',label:'₹6,000 – ₹8,999',min:6000,max:8999},
  {value:'9000-plus',label:'₹9,000 & above',min:9000,max:Infinity},
];
export function matchesFilters(p, filters) {
  const range = priceRanges.find(r => r.value === filters.price);
  return (!filters.colour || colourOf(p) === filters.colour)
    && (!filters.fabric || fabricOf(p) === filters.fabric)
    && (!range || (p.price >= range.min && p.price <= range.max));
}
export function ProductFilters({products,filters,setFilters,count,category,search,clearAll,clearCategory,clearSearch}) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = Object.values(filters).filter(Boolean).length;
  const colours = [...new Set(products.map(colourOf))].sort();
  const fabrics = [...new Set(products.map(fabricOf))].sort();
  const chips = Object.entries(filters).filter(([,v])=>v).map(([key,value])=>({key,label:key==='price'?priceRanges.find(r=>r.value===value)?.label:value,remove:()=>setFilters(f=>({...f,[key]:''}))}));
  if(category!=='All styles') chips.unshift({key:'category',label:category,remove:clearCategory});
  if(search) chips.push({key:'search',label:`Search: ${search}`,remove:clearSearch});
  return <div className="product-filters">
    <button type="button" className="mobile-filter-toggle" aria-expanded={expanded} aria-controls="collection-filter-controls" onClick={() => setExpanded(value => !value)}><SlidersHorizontal size={16}/><span>{expanded ? 'Hide filters' : 'Filter your favourites'}{activeCount > 0 ? ` (${activeCount})` : ''}</span><span aria-hidden="true">{expanded ? '−' : '+'}</span></button>
    <div id="collection-filter-controls" className={`filter-controls${expanded ? ' filters-expanded' : ''}`}><span className="filter-heading"><SlidersHorizontal size={17}/> Refine your favourites</span>
      <label>Colour<select aria-label="Colour" value={filters.colour} onChange={e=>setFilters(f=>({...f,colour:e.target.value}))}><option value="">All colours</option>{colours.map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Fabric<select aria-label="Fabric" value={filters.fabric} onChange={e=>setFilters(f=>({...f,fabric:e.target.value}))}><option value="">All fabrics</option>{fabrics.map(f=><option key={f}>{f}</option>)}</select></label>
      <label>Price range<select aria-label="Price range" value={filters.price} onChange={e=>setFilters(f=>({...f,price:e.target.value}))}><option value="">All prices</option>{priceRanges.map(p=><option value={p.value} key={p.value}>{p.label}</option>)}</select></label>
    </div>
    <div className="filter-results"><span role="status" aria-live="polite">{count} {count===1?'style':'styles'} found</span>{chips.length>0&&<><div className="filter-chips">{chips.map(c=><button key={c.key} onClick={c.remove} aria-label={`Remove ${c.label} filter`}>{c.label}<X size={12}/></button>)}</div><button className="clear-filters" onClick={clearAll}>Clear all</button></>}</div>
  </div>;
}
