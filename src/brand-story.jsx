import React from 'react';
import { ArrowUpRight, Heart, Sparkles, Flower2, Gem, Sun } from 'lucide-react';
import './brand-story.css';

export function BrandLogo({ footer = false }) {
  return <a className={`rajo-logo${footer ? ' rajo-logo-footer' : ''}`} href="#/" aria-label="RAJO Threads home"><img src="/images/rajo-threads-logo.jpeg" alt="RAJO Threads — Where Tradition Meets Trend" width="1600" height="1600"/></a>;
}

export function FounderStoryPreview() {
  return <section className="founder-preview page-width" aria-labelledby="founder-preview-title">
    <div className="founder-preview-photo"><img src="/images/pinki-yadav.jpeg" alt="Pinki Yadav, founder of RAJO Threads, wearing a soft lavender saree" width="1024" height="1536" loading="lazy"/><span>Meet the heart behind the threads</span></div>
    <div className="founder-preview-copy"><div className="eyebrow">OUR STORY · OUR HEART</div><h2 id="founder-preview-title">A small beginning.<br/><em>A beautiful dream.</em></h2><p>From a small exhibition stall to a dream of celebrating every woman. RAJO Threads began with a simple wish: to make you feel beautiful, confident, and special in the saree you choose.</p><blockquote>“Every woman deserves to experience the beauty and richness of a premium saree, regardless of her budget.”</blockquote><div className="founder-signature">Pinki Yadav<small>FOUNDER, RAJO THREADS</small></div><a className="text-link" href="#/about">Discover our story <ArrowUpRight size={18}/></a></div>
  </section>;
}

const mission = [
  [Heart, 'Every woman, every style', 'Celebrate every woman and her unique style.'],
  [Gem, 'Premium, within reach', 'Offer beautiful, premium-quality sarees at accessible prices.'],
  [Sparkles, 'Growing with you', 'Understand and cater to the changing needs and preferences of modern women.'],
  [Flower2, 'Tradition meets today', 'Blend traditional craftsmanship with contemporary design.'],
  [Sun, 'For all your moments', 'Make sarees suitable for every occasion — from everyday wear to celebrations.'],
];

export function BrandStoryPage() {
  return <div className="brand-story">
    <section className="brand-story-hero">
      <div className="breadcrumb"><a href="#/">Home</a><span>/</span><span>Our story</span></div>
      <div className="eyebrow">THE HEART OF RAJO THREADS</div><h1>Where tradition<br/>meets <em>the trend.</em></h1><p>Rooted in love. Woven with purpose.<br/>A celebration of every woman, every style, every occasion.</p>
      <div className="story-hero-bottom"><span>OUR STORY, WOVEN WITH LOVE</span><a href="#/collections/sarees">Explore our sarees <ArrowUpRight size={17}/></a></div>
      <span className="story-hero-flower" aria-hidden="true">✳</span>
    </section>

    <section className="story-origins story-container" aria-labelledby="origins-title">
      <div className="origins-heading"><div className="eyebrow">01 / OUR STORY</div><h2 id="origins-title">It started with<br/><em>a simple dream.</em></h2><span className="story-thread" aria-hidden="true"/><p>Beautiful sarees.<br/>Meaningful connections.<br/>A little more confidence.</p></div>
      <div className="origins-copy"><p className="story-lead">RAJO Threads began with a simple yet heartfelt dream — to make every woman feel beautiful, confident, and special in the saree she chooses.</p><p>Our journey started from humble beginnings, with a small stall at exhibitions, where we connected directly with women, listened to their preferences, understood their individual styles, and learned what truly matters to them when choosing a saree.</p><p>What started as a small beginning gradually became a bigger vision — to create a brand that celebrates every woman, every style, and every occasion.</p></div>
    </section>

    <section className="story-belief"><Flower2 size={32} aria-hidden="true"/><h2>More than a saree.<br/><em>A celebration of you.</em></h2><p>RAJO Threads is not just about sarees. It is about celebrating womanhood, individuality, tradition, and the confidence that comes from wearing something beautiful.</p><div><span>WOMANHOOD</span><i aria-hidden="true">✦</i><span>INDIVIDUALITY</span><i aria-hidden="true">✦</i><span>TRADITION</span></div></section>

    <section className="founder-section story-container" aria-labelledby="founder-title">
      <figure className="founder-portrait"><div><img src="/images/pinki-yadav.jpeg" alt="Pinki Yadav, founder of RAJO Threads, smiling in a lavender saree" width="1024" height="1536" loading="lazy"/></div><figcaption><span>Pinki Yadav</span><small>FOUNDER, RAJO THREADS</small></figcaption><span className="portrait-corner" aria-hidden="true">With love,<br/><em>Pinki</em></span></figure>
      <div className="founder-vision"><div className="eyebrow">02 / FOUNDER’S VISION</div><h2 id="founder-title">Premium in feel.<br/><em>Inclusive at heart.</em></h2><p>The vision behind RAJO Threads is to create a brand where premium style and affordability come together.</p><blockquote><span aria-hidden="true">“</span><p>I believe every woman deserves to experience the beauty and richness of a premium saree, regardless of her budget. My vision is to make elegant fashion accessible, while preserving the beauty, tradition, and emotions attached to the saree.</p><footer>— Pinki Yadav, Founder, RAJO Threads</footer></blockquote><div className="founder-signature" aria-hidden="true">Pinki Yadav</div></div>
    </section>

    <section className="story-mission" aria-labelledby="mission-title"><div className="story-container"><div className="mission-heading"><div><div className="eyebrow">03 / OUR MISSION</div><h2 id="mission-title">Beautiful intentions.<br/><em>In every thread.</em></h2></div><p>Our mission at RAJO Threads is to bring a little more beauty, meaning, and possibility to every woman’s wardrobe.</p></div><div className="mission-grid">{mission.map(([Icon, title, text], i) => <article key={title}><div className="mission-number"><Icon size={25} aria-hidden="true"/><span>0{i + 1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className="name-story story-container" aria-labelledby="name-title"><div className="name-keepsake" aria-label="Rajo, a name held close to the heart"><span>A NAME. A MEMORY. A LEGACY.</span><div>Rajo<small>राजो</small></div><p>For Dadi.<br/>With love, always.</p><Heart size={23} aria-hidden="true"/></div><div className="name-copy"><div className="eyebrow">04 / THE STORY BEHIND THE NAME</div><h2 id="name-title">A name from the heart.<br/><em>A love that lives on.</em></h2><p className="story-lead">Every brand has a story, but RAJO Threads has a story close to the heart.</p><p>The name “RAJO” is a tribute to the Founder, Pinki Yadav’s beloved Dadi, Rajo.</p><p>For Pinki, Rajo was more than just a grandmother. She represented the warmth of family, the grace of tradition, the strength of a woman, and the timeless values that are passed from one generation to another.</p><div className="legacy-note">The warmth of family. The grace of tradition.<br/>Carried forward, one thread at a time.</div></div></section>

    <section className="story-closing"><div className="eyebrow">EVERY WOMAN. EVERY STYLE. EVERY OCCASION.</div><h2>Your story deserves<br/><em>something beautiful.</em></h2><a className="primary" href="#/collections/sarees">Find your saree <ArrowUpRight size={18}/></a><a className="story-contact-link" href="#/contact">We’d love to hear from you <ArrowUpRight size={16}/></a></section>
  </div>;
}
