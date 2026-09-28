import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Play, Volume2, Film } from 'lucide-react';
import { products } from '../../products.js';
import './lookbook.css';

export default function VideoLookbook() {
  const [active, setActive] = useState(products[0]);
  const [filter, setFilter] = useState('All films');
  const [failed, setFailed] = useState(false);
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    // This page owns the only media player. Navigation/unmount stops its soundtrack.
    return () => {
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    };
  }, []);

  const select = p => {
    videoRef.current?.pause();
    setFailed(false);
    setActive(p);
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return <div className="lookbook-page">
    <section className="lookbook-intro">
      <div className="breadcrumb"><a href="#/">Home</a><span>/</span><span>Video lookbook</span></div>
      <div className="eyebrow"><Film size={15}/> THE RANG MOTION EDIT</div>
      <h1>A little colour.<br/><em>A little rhythm.</em></h1>
      <p>Twelve looks, brought to life with gentle motion and an original instrumental soundtrack. Take a moment. Find your shade.</p>
      <span className="lookbook-mark" aria-hidden="true">✳</span>
    </section>
    <section className="film-feature page-width" ref={playerRef}>
      <div className="film-screen">
        <video ref={videoRef} src={`/videos/${active.image}.webm`} poster={`/images/${active.image}.jpg`} controls playsInline preload="none" aria-label={`${active.name} motion film with instrumental music`} onError={() => setFailed(true)} />
        {failed && <p role="alert" className="film-error">This film couldn’t load. Please refresh or choose another look.</p>}
      </div>
      <div className="film-description">
        <span className="film-index">{String(active.id).padStart(2, '0')} <span>/ 12 FILMS</span></span>
        <div className="eyebrow">{active.category.toUpperCase()} · THE MOTION EDIT</div>
        <h2>{active.name}</h2>
        <p>{active.fabric}. A closer look at the colours and details, with a slow, flowing camera movement.</p>
        <div className="sound-note"><Volume2 size={18}/><span>Press play for picture + music.<br/><small>Original instrumental · No spoken audio</small></span></div>
        <a className="primary" href={`#/product/${active.id}`}>Explore this look <ArrowUpRight size={18}/></a>
        <p className="film-caption">A motion study created from the collection photograph.</p>
      </div>
    </section>
    <section className="film-library page-width">
      <div className="section-heading"><div><div className="eyebrow">TWELVE SHADES OF BEAUTIFUL</div><h2>Find your next <em>favourite frame.</em></h2></div><span className="section-note">Choose a look. Press play. Stay a while.</span></div>
      <div className="tabs film-tabs">{['All films', 'Sarees', 'Lehengas', 'Kurta sets'].map(c => <button key={c} className={filter === c ? 'active' : ''} onClick={() => setFilter(c)}>{c}</button>)}</div>
      <div className="film-grid">{products.filter(p => filter === 'All films' || p.category === filter).map(p => <button key={p.id} className={`film-card ${active.id === p.id ? 'chosen' : ''}`} onClick={() => select(p)} aria-label={`Select film: ${p.name}`} aria-pressed={active.id === p.id}>
        <div className="film-poster"><img src={`/images/${p.image}.jpg`} alt={p.name} loading="lazy"/><span className="film-play"><Play size={22}/></span><small>0:07 · WITH MUSIC</small></div>
        <span className="eyebrow">{p.category}</span><h3>{p.name}</h3><span className="film-card-link">{active.id === p.id ? 'Selected above' : 'Watch the film'} <ArrowUpRight size={15}/></span>
      </button>)}</div>
    </section>
  </div>;
}
