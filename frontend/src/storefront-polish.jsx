import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      className="whatsapp-float"
      href="https://wa.me/919716422466"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with RAJO on WhatsApp: +91 97164 22466"
      title="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
        <path d="M20.52 3.48A11.91 11.91 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.16 1.6 5.98L0 24l6.25-1.64a11.93 11.93 0 0 0 5.8 1.48h.01C18.64 23.84 24 18.48 24 11.9c0-3.19-1.24-6.19-3.48-8.42Zm-8.47 18.34a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.61-.23-.37a9.88 9.88 0 0 1-1.52-5.27c0-5.47 4.45-9.92 9.92-9.92a9.85 9.85 0 0 1 7.02 2.91 9.85 9.85 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.97 9.92Zm5.44-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.2 5.09 4.48.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}

export function useSavedBag(products) {
  const [bag, setBag] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rajo-bag") || "[]");
      if (!Array.isArray(saved)) return [];
      const seen = new Set();
      return saved.flatMap((item) => {
        const product = products.find((p) => p.id === item?.id);
        if (!product || !Number.isInteger(item.qty) || item.qty < 1) return [];
        const size = product.category === "Kurta sets" ? item.size : undefined;
        if (
          product.category === "Kurta sets" &&
          !["S", "M", "L", "XL", "XXL"].includes(size)
        )
          return [];
        const key = product.id + "-" + (size || "free");
        if (seen.has(key)) return [];
        seen.add(key);
        return [
          {
            ...product,
            ...(size ? { size } : {}),
            key,
            qty: Math.min(item.qty, 99),
          },
        ];
      });
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        "rajo-bag",
        JSON.stringify(bag.map(({ id, size, qty }) => ({ id, size, qty }))),
      );
    } catch {
      /* Shopping remains available without browser storage. */
    }
  }, [bag]);
  return [bag, setBag];
}

export function useSavedWishlist(products) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rajo-wishlist") || "[]");
      return Array.isArray(saved)
        ? [...new Set(saved)].filter((id) =>
            products.some((product) => product.id === id),
          )
        : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("rajo-wishlist", JSON.stringify(wishlist));
    } catch {
      /* Browsing still works when storage is unavailable. */
    }
  }, [wishlist]);
  return [wishlist, setWishlist];
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 650);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    visible && (
      <button
        className="back-to-top"
        type="button"
        aria-label="Back to top"
        title="Back to top"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "instant" });
          document.querySelector(".skip-link")?.focus({ preventScroll: true });
        }}
      >
        <ArrowUp size={19} />
      </button>
    )
  );
}
