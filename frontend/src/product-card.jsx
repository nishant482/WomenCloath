import React from "react";
import { Heart, Plus } from "lucide-react";
import { productImage } from "./api.js";
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
export function ProductCard({ product: p, wish, toggleWish, add }) {
  return (
    <article className="product">
      <div className="product-photo">
        <a
          className="image-button"
          href={"/product/" + p.id}
          aria-label={`View ${p.name}`}
        >
          <img
            src={productImage(p)}
            alt={p.name}
            loading="lazy"
            width="600"
            height="800"
          />
        </a>
        <span
          className={"badge " + (p.tag === "NEW ARRIVAL" ? "blue-badge" : "")}
        >
          {p.tag}
        </span>
        <button
          className={"wish-button " + (wish.includes(p.id) ? "saved" : "")}
          onClick={() => toggleWish(p.id)}
          aria-pressed={wish.includes(p.id)}
          aria-label={
            wish.includes(p.id) ? "Remove from wishlist" : "Add to wishlist"
          }
        >
          <Heart
            size={18}
            fill={wish.includes(p.id) ? "currentColor" : "none"}
          />
        </button>
        <button
          className="quick-add"
          disabled={p.stock < 1}
          onClick={() => add(p)}
        >
          {p.stock < 1
            ? "Out of stock"
            : p.category === "Kurta sets"
              ? "Choose your size"
              : "Add to bag"}
          <Plus size={17} />
        </button>
      </div>
      <div className="product-meta">
        <span>{p.category}</span>
        <span
          className="swatch"
          aria-hidden="true"
          style={{ background: p.color }}
        />
      </div>
      <a className="product-name" href={"/product/" + p.id}>
        {p.name}
      </a>
      <p className="fabric">{p.fabric}</p>
      <div className="price">
        <strong>{money(p.price)}</strong>{" "}
        {p.old > p.price && <del>{money(p.old)}</del>}
        {p.old > p.price && (
          <small>{Math.round((1 - p.price / p.old) * 100)}% off</small>
        )}
      </div>
    </article>
  );
}
