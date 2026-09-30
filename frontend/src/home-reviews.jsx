import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { sampleReviews } from './account.jsx';
import './home-reviews.css';

export function HomeReviews() {
  const track = useRef(null);
  const [position, setPosition] = useState({ index: 0, end: false });
  useEffect(() => {
    const element = track.current;
    const update = () => {
      const step = element.children[1].offsetLeft - element.children[0].offsetLeft;
      setPosition({ index: Math.round(element.scrollLeft / step), end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 });
    };
    const resize = new ResizeObserver(update);
    resize.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => { resize.disconnect(); element.removeEventListener('scroll', update); };
  }, []);
  const move = direction => {
    const element = track.current;
    const step = element.children[1].offsetLeft - element.children[0].offsetLeft;
    element.scrollBy({ left: step * direction, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  return <section className="home-reviews" aria-labelledby="home-reviews-title" aria-roledescription="carousel">
    <div className="page-width">
      <div className="home-reviews-heading"><div><span className="eyebrow">THE RAJO COMMUNITY</span><h2 id="home-reviews-title">Little notes. Beautiful stories.</h2><p>A little inspiration from our sample customer reviews.</p></div>
        <div className="home-review-controls"><button aria-label="Previous reviews" aria-controls="home-review-track" disabled={position.index === 0} onClick={() => move(-1)}><ChevronLeft size={19} /></button><button aria-label="Next reviews" aria-controls="home-review-track" disabled={position.end} onClick={() => move(1)}><ChevronRight size={19} /></button></div>
      </div>
      <div className="home-review-track" id="home-review-track" ref={track} tabIndex={0} aria-label="Customer reviews; use left and right arrows to browse" onKeyDown={e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1); } }}>
        {sampleReviews.map((review, index) => <article className="home-review-card" key={review._id} aria-label={`Review ${index + 1} of ${sampleReviews.length}`}>
          <div className="home-review-rating"><span role="img" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} aria-hidden="true" />)}</span><Quote size={25} aria-hidden="true" /></div>
          <h3>{review.title}</h3><p>{review.body}</p><div className="home-review-author"><span aria-hidden="true">{review.name[0]}</span><strong>{review.name}</strong><span>RAJO community</span></div>
        </article>)}
      </div>
      <div className="home-review-progress"><span aria-live="polite">{String(position.index + 1).padStart(2, '0')} / {String(sampleReviews.length).padStart(2, '0')}</span><span>Thoughtful details. Everyday elegance.</span></div>
    </div>
  </section>;
}
