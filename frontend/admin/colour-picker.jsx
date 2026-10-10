import React from 'react';
const shades=[['Off-white','#FAF9F6'],['Ivory','#FFFFF0'],['Cream','#FFFDD0'],['White','#FFFFFF'],['Beige','#F5F5DC'],['Pista green','#BFD8A1'],['Cherry red','#C32643'],['Pink','#FFC0CB'],['Maroon','#800000'],['Mustard','#D4A017'],['Green','#008000'],['Teal','#008080'],['Blue','#0000FF'],['Purple','#800080'],['Orange','#FFA500'],['Brown','#A52A2A'],['Grey','#808080'],['Black','#000000']];
export function ColourPicker({value,onChange}){
 const selected=shades.find(([,hex])=>hex===value?.toUpperCase());
 const change=hex=>onChange(hex,shades.find(([,code])=>code===hex.toUpperCase())?.[0]);
 return <div className="span-all" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12}}>
 <label>Select colour by name<select aria-label="Select colour by name" value={selected?.[1]||''} onChange={e=>{if(e.target.value)change(e.target.value);}}><option value="">Custom colour</option>{shades.map(([name,hex])=><option key={hex} value={hex}>{name}</option>)}</select></label>
 <label>Colour code<input aria-label="Swatch colour code" value={value||''} onChange={e=>change(e.target.value)} placeholder="#FAF9F6" pattern="#[0-9A-Fa-f]{6}" maxLength={7} required /></label>
 <label>Colour picker<input aria-label="Custom colour picker" type="color" value={/^#[0-9a-f]{6}$/i.test(value)?value:'#FAF9F6'} onChange={e=>change(e.target.value)}/></label>
 <div aria-label="Quick colour choices" style={{gridColumn:'1 / -1',display:'flex',gap:10,flexWrap:'wrap'}}>{shades.slice(0,7).map(([name,hex])=><button type="button" key={hex} aria-pressed={selected?.[1]===hex} onClick={()=>change(hex)} style={{border:selected?.[1]===hex?'2px solid #c32643':'1px solid #d6c6b8',padding:'8px 10px',display:'flex',gap:6,alignItems:'center'}}><span aria-hidden="true" style={{width:20,height:20,background:hex,border:'1px solid #b8ada1',borderRadius:'50%'}}/>{name}</button>)}</div>
 </div>;
}
