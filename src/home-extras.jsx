import { CommunityLinks } from './community.jsx';
import { BrandLogo } from './brand-story.jsx';
import React from 'react';
import { ArrowUpRight, ArrowRight, Sparkles, Heart, PackageCheck } from 'lucide-react';
import { optionalPages } from './optional-pages';
import './home-extras.css';

export function HomeExtras() {
  return <>

    <section className="style-notes page-width"><div className="section-heading"><div><div className="eyebrow">THE LITTLE THINGS MAKE THE LOOK</div><h2>A few notes on <em>being you.</em></h2></div><a className="text-link" href="#/about">Inside the world of RAJO Threads <ArrowUpRight size={17}/></a></div>
      <div className="notes-grid">{[
        ['01','The art of the drape','One saree. Your own kind of beautiful. Let the details shine with a simple drape and your favourite finishing touch.','purple','/collections/sarees'],
        ['02','Less effort. More you.','An easy kurta set, a pair of everyday earrings, and you’re ready for wherever the afternoon takes you.','emerald','/collections/kurta-sets'],
        ['03','Make an entrance','Let your lehenga do the talking. Choose a colour you love, add a little sparkle, and make the moment yours.','blue','/collections/lehengas'],
      ].map(([n,title,copy,img,path]) => <article key={n}><a href={'#'+path}><img src={`/images/${img}.jpg`} alt={title} loading="lazy"/></a><div><span className="eyebrow">STYLE NOTE / {n}</span><h3>{title}</h3><p>{copy}</p><a className="text-link" href={'#'+path}>Find your look <ArrowUpRight size={15}/></a></div></article>)}</div>
    </section>
    {optionalPages['/lookbook'] && <section className="lookbook-invitation page-width"><div className="invitation-pictures"><img src="/images/pink.jpg" alt="Rani pink saree from the motion edit" loading="lazy"/><img src="/images/floral.jpg" alt="Floral lehenga from the motion edit" loading="lazy"/></div><div><div className="eyebrow">NOW SHOWING · THE MOTION EDIT</div><h2>Colour has<br/><em>a rhythm of its own.</em></h2><p>Twelve looks. Gentle movement. A little music.<br/>Step inside our video lookbook.</p><a className="primary" href="#/lookbook">Watch the films <ArrowUpRight size={18}/></a></div></section>}
    <section className="rang-details page-width">{[[Heart,'Made for your moments','Everyday favourites and pieces for the days you’ll remember.'],[Sparkles,'Details worth a closer look','Beautiful borders, playful prints, and expressive colours.'],[PackageCheck,'Your wardrobe, thoughtfully picked','Twelve distinctive styles, with room for your individuality.']].map(([Icon,title,text]) => <div key={title}><Icon size={26}/><h3>{title}</h3><p>{text}</p></div>)}</section>
    <section className="colour-gallery page-width"><div className="eyebrow">A LITTLE MORE COLOUR, EVERY DAY</div><h2>The world of <em>RAJO Threads.</em></h2><p>Small details. Beautiful stories. Find a little inspiration.</p><div>{['magenta','sharara','terracotta','charcoal','kurta','purple'].map((img,i) => <a key={img} href={'#/product/'+[5,7,4,10,9,12][i]}><img src={`/images/${img}.jpg`} alt={`Explore the ${img} collection look`} loading="lazy"/><span><ArrowUpRight size={23}/></span></a>)}</div></section>
  </>;
}

const footerGroups = [
  ['SHOP', [['Sarees', '/collections/sarees'], ['Kurta sets', '/collections/kurta-sets'], ['Lehengas', '/collections/lehengas'], ['New arrivals', '/collections/new-arrivals']]],
  ['DISCOVER RAJO', [['Our story', '/about'], ['The RAJO family', '/rajo-family'], ['All collections', '/collections/all']]],
  ['WE’RE HERE TO HELP', [['Contact us', '/contact'], ['Shipping & returns', '/shipping'], ['Care for your saree', '/product/1']]],
];

export function SiteFooter() {
  return <footer className="site-footer refined-footer">
    <div className="footer-layout">
      <div className="footer-identity">
        <div className="footer-brandline"><BrandLogo footer/><div><span>RAJO THREADS</span><p>Where tradition<br/><em>meets the trend.</em></p></div></div>
        <p className="footer-description">Thoughtfully chosen styles.<br/>For every woman and her beautiful moments.</p>
        <div className="footer-connect"><span>STAY CLOSE</span><CommunityLinks/></div>
      </div>
      {footerGroups.map(([title, links]) => <nav className="footer-link-group" aria-label={title} key={title}><h2>{title}</h2>{links.map(([label, path]) => <a key={label} href={'#' + path}>{label}</a>)}</nav>)}
    </div>
    <div className="footer-lastline"><span>© {new Date().getFullYear()} RAJO Threads. All rights reserved.</span><span className="footer-heartline">A little tradition. A lot of heart. <Heart size={13} aria-hidden="true"/></span><a href="#/contact">Let’s talk <ArrowUpRight size={14}/></a></div>
  </footer>;
}