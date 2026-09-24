import React from 'react';
import { Instagram, MessageCircle } from 'lucide-react';

export function CommunityLinks() {
  return <div className="footer-socials">
    <a href="https://www.instagram.com/rajo_threads?utm_source=qr&igsh=dTVydWg0bnRpeHU5" target="_blank" rel="noopener noreferrer" className="instagram-link" title="Follow RAJO Threads on Instagram" aria-label="Follow RAJO Threads on Instagram (opens in a new tab)"><Instagram size={16}/></a>
    <a href="https://chat.whatsapp.com/DrdR9EBiDbM6rHXIPuLumC" target="_blank" rel="noopener noreferrer" className="whatsapp-link" title="Join our WhatsApp group" aria-label="Join the RAJO Threads WhatsApp group (opens in a new tab)"><MessageCircle size={16}/></a>
  </div>;
}