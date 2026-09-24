import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function useSavedWishlist(products) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rajo-wishlist') || '[]');
      return Array.isArray(saved) ? [...new Set(saved)].filter(id => products.some(product => product.id === id)) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem('rajo-wishlist', JSON.stringify(wishlist)); } catch { /* Browsing still works when storage is unavailable. */ }
  }, [wishlist]);
  return [wishlist, setWishlist];
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 650);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return visible && <button className="back-to-top" type="button" aria-label="Back to top" title="Back to top" onClick={() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector('.skip-link')?.focus({ preventScroll: true });
  }}><ArrowUp size={19}/></button>;
}
