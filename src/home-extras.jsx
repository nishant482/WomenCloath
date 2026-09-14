import React from 'react';
import { ArrowUpRight, ArrowRight, Sparkles, Heart, PackageCheck } from 'lucide-react';
import { optionalPages } from './optional-pages';
import './home-extras.css';

export function HomeExtras() {
  return <>
    <section className="sunshine-edit page-width">
      <div className="sunshine-copy"><div className="eyebrow">THE GOLDEN HOUR EDIT</div><h2>Here comes<br/><em>your sunshine.</em></h2><p>Marigold mornings. Golden evenings. Discover warm shades that make every little celebration glow.</p><a className="primary" href="#/product/1">Meet your golden favourite <ArrowUpRight size={18}/></a><span aria-hidden="true">✳</span></div>
      <img src="/images/yellow.jpg" alt="Mustard silk saree with embroidered golden details" loading="lazy"/>
      <img src="/images/ivory.jpg" alt="Ivory saree styled with a golden blouse" loading="lazy"/>
    </section>
    <section className="style-notes page-width"><div className="section-heading"><div><div className="eyebrow">THE LITTLE THINGS MAKE THE LOOK</div><h2>A few notes on <em>being you.</em></h2></div><a className="text-link" href="#/about">Inside the world of Rang <ArrowUpRight size={17}/></a></div>
      <div className="notes-grid">{[
        ['01','The art of the drape','One saree. Your own kind of beautiful. Let the details shine with a simple drape and your favourite finishing touch.','purple','/collections/sarees'],
        ['02','Less effort. More you.','An easy kurta set, a pair of everyday earrings, and you’re ready for wherever the afternoon takes you.','emerald','/collections/kurta-sets'],
        ['03','Make an entrance','Let your lehenga do the talking. Choose a colour you love, add a little sparkle, and make the moment yours.','blue','/collections/lehengas'],
      ].map(([n,title,copy,img,path]) => <article key={n}><a href={'#'+path}><img src={`/images/${img}.jpg`} alt={title} loading="lazy"/></a><div><span className="eyebrow">STYLE NOTE / {n}</span><h3>{title}</h3><p>{copy}</p><a className="text-link" href={'#'+path}>Find your look <ArrowUpRight size={15}/></a></div></article>)}</div>
    </section>
    {optionalPages['/lookbook'] && <section className="lookbook-invitation page-width"><div className="invitation-pictures"><img src="/images/pink.jpg" alt="Rani pink saree from the motion edit" loading="lazy"/><img src="/images/floral.jpg" alt="Floral lehenga from the motion edit" loading="lazy"/></div><div><div className="eyebrow">NOW SHOWING · THE MOTION EDIT</div><h2>Colour has<br/><em>a rhythm of its own.</em></h2><p>Twelve looks. Gentle movement. A little music.<br/>Step inside our video lookbook.</p><a className="primary" href="#/lookbook">Watch the films <ArrowUpRight size={18}/></a></div></section>}
    <section className="rang-details page-width">{[[Heart,'Made for your moments','Everyday favourites and pieces for the days you’ll remember.'],[Sparkles,'Details worth a closer look','Beautiful borders, playful prints, and expressive colours.'],[PackageCheck,'Your wardrobe, thoughtfully picked','Twelve distinctive styles, with room for your individuality.']].map(([Icon,title,text]) => <div key={title}><Icon size={26}/><h3>{title}</h3><p>{text}</p></div>)}</section>
    <section className="colour-gallery page-width"><div className="eyebrow">A LITTLE MORE COLOUR, EVERY DAY</div><h2>The world of <em>Rang.</em></h2><p>Small details. Beautiful stories. Find a little inspiration.</p><div>{['magenta','sharara','terracotta','charcoal','kurta','purple'].map((img,i) => <a key={img} href={'#/product/'+[5,7,4,10,9,12][i]}><img src={`/images/${img}.jpg`} alt={`Explore the ${img} collection look`} loading="lazy"/><span><ArrowUpRight size={23}/></span></a>)}</div></section>
  </>;
}

const footerGroups = [
  ['SHOP BY STYLE', [['All styles','/collections/all'],['New arrivals','/collections/new-arrivals'],['Sarees','/collections/sarees'],['Lehengas','/collections/lehengas'],['Kurta sets','/collections/kurta-sets'],['Ready to ship','/collections/all']]],
  ['THE OCCASION EDIT', [['Wedding guest','/collections/lehengas'],['Festive favourites','/collections/all'],['Everyday elegance','/collections/kurta-sets'],['The golden hour edit','/product/1'],['Celebration sarees','/collections/sarees'],['Gifting inspiration','/collections/all']]],
  ['HERE TO HELP', [['Contact us','/contact'],['Shipping information','/shipping'],['Returns & exchanges','/shipping'],['Frequently asked questions','/contact'],['Product care','/product/1'],['Size guide',null],['Track your order',null]]],
  ['THE WORLD OF RANG', [['Our story','/about'],['Our collection','/collections/all'],['Care for your colours','/product/1'],['The Rang philosophy','/about'],['Style inspiration','/collections/new-arrivals'],['Collaborations','/contact'],['Store locator',null],['Careers',null]]],
];

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><a className="logo footer-logo" href="#/">rang<span>रंग</span><small>EVERY SHADE OF YOU</small></a><h3>Indian at heart.<br/>Beautifully you.</h3><p>Colourful pieces for the big celebrations and beautiful little moments.</p><div className="social-placeholders" aria-label="Social channels"><span>Instagram</span><span>Pinterest</span><span>Facebook</span></div></div>
      {footerGroups.map(([title,links]) => <div className="footer-column" key={title}><h3>{title}</h3>{links.map(([label,path]) => path ? <a key={label} href={'#'+path}>{label}</a> : <span key={label} className="footer-placeholder" aria-disabled="true">{label}</span>)}{title==='THE WORLD OF RANG' && optionalPages['/lookbook'] && <a href="#/lookbook">Video lookbook <ArrowUpRight size={12}/></a>}</div>)}
    </div>
    <div className="footer-signoff"><span>ALL COLOURS. ALL OCCASIONS. ALL YOU.</span><span>✳</span><span>A little tradition. A lot of heart.</span></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Rang. All colours welcome.</span><div><span aria-disabled="true">Privacy policy</span><span aria-disabled="true">Terms & conditions</span><span aria-disabled="true">Cookie policy</span><a href="#/contact">Help centre</a></div><span>Designed with colour, in India.</span></div>
  </footer>;
}
