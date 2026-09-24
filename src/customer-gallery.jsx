import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Heart, X, Expand } from 'lucide-react';
import './customer-gallery.css';

const moments = [
  ['7.40.11 AM (1)', 'Together at RAJO', 'A group of customers in the shop with RAJO Threads shopping bags'],
  ['7.40.12 AM', 'Dressed for beautiful moments', 'A customer in a patterned saree alongside two girls in festive outfits'],
  ['7.40.14 AM (1)', 'A little RAJO to take home', 'A customer holding a RAJO Threads bag beside a display of sarees'],
  ['7.40.11 AM', 'From our shop, with love', 'Three women posing in the shop with RAJO Threads shopping bags'],
  ['7.40.12 AM (2)', 'A moment at our exhibition', 'Two women holding a RAJO Threads bag at a saree exhibition stall'],
  ['7.40.14 AM', 'Smiles worth remembering', 'Two women smiling with a RAJO Threads bag beside colourful fabrics'],
  ['7.40.12 AM (1)', 'Little moments, lovely connections', 'Three women with shopping bags at an evening exhibition'],
  ['7.40.13 AM', 'Part of the RAJO story', 'Two women with a RAJO Threads bag in front of the exhibition display'],
  ['7.40.13 AM (1)', 'Taking a little tradition home', 'A customer holding a RAJO Threads shopping bag at the exhibition stall'],
].map(([file, caption, alt]) => ({ src: `/customer/${encodeURIComponent(`WhatsApp Image 2026-09-24 at ${file}.jpeg`)}`, caption, alt }));

export function CustomerGallery() {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const moreButton = useRef(null);
  const active = selected === null ? null : moments[selected];

  useEffect(() => {
    if (selected === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected !== null]);

  const open = index => { setSelected(index); dialog.current.showModal(); };
  const close = () => dialog.current.close();
  const step = direction => setSelected(index => (index + direction + moments.length) % moments.length);
  const photo = (moment, index, featured = false) => <figure className={featured ? 'customer-photo customer-photo-featured' : 'customer-photo'} key={moment.src}>
    <button type="button" onClick={() => open(index)} aria-label={`View photo: ${moment.caption}`}>
      <img src={moment.src} alt={moment.alt} loading="lazy" decoding="async"/>
      <span className="customer-expand" aria-hidden="true"><Expand size={17}/></span>
    </button>
    <figcaption><span>{moment.caption}</span><Heart size={15} aria-hidden="true"/></figcaption>
  </figure>;

  return <section className="customer-gallery page-width" id="customer-moments" aria-labelledby="customer-gallery-title">
    <div className="customer-heading"><div><div className="eyebrow">THE PEOPLE WHO MAKE OUR STORY</div><h1 id="customer-gallery-title">The RAJO family.<br/><em>Beautiful moments, together.</em></h1></div><p>From finding a favourite to dressing for a celebration — a few moments with the women who make RAJO Threads special.</p></div>
    <div className="customer-feature">{photo(moments[0], 0, true)}<div className="customer-note"><Heart size={27} aria-hidden="true"/><span>OUR COMMUNITY, OUR HEART</span><h3>More than a shopping bag.<br/><em>A memory to take home.</em></h3><p>A warm conversation. A shared smile. The joy of finding something beautiful. Thank you for making us a part of your story.</p><span className="customer-signoff">With love, RAJO Threads</span></div></div>
    <div className="customer-grid">{moments.slice(1, 4).map((moment, i) => photo(moment, i + 1))}</div>
    <div className="customer-grid customer-more" id="more-customer-moments" hidden={!expanded}>{expanded && moments.slice(4).map((moment, i) => photo(moment, i + 4))}</div>
    <div className="customer-gallery-actions"><span>Little glimpses of the RAJO family</span><button ref={moreButton} type="button" aria-expanded={expanded} aria-controls="more-customer-moments" onClick={() => { if (expanded) moreButton.current.scrollIntoView({ block: 'center', behavior: 'instant' }); setExpanded(value => !value); }}>{expanded ? 'Show fewer moments' : `View all ${moments.length} moments`}{expanded ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}</button></div>
    <dialog ref={dialog} className="customer-lightbox" aria-label="RAJO customer photo gallery" onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); step(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); } }}>
      {active && <div className="customer-lightbox-content"><button className="customer-lightbox-close" type="button" onClick={close} aria-label="Close photo"><X size={23}/></button><img src={active.src} alt={active.alt}/><div className="customer-lightbox-controls"><button type="button" onClick={() => step(-1)} aria-label="Previous photo"><ArrowLeft size={21}/></button><div aria-live="polite"><span>{active.caption}</span><small>{selected + 1} / {moments.length}</small></div><button type="button" onClick={() => step(1)} aria-label="Next photo"><ArrowRight size={21}/></button></div></div>}
    </dialog>
  </section>;
}
