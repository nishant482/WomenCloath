import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  PackageCheck,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";
import { useStore } from "./store-context.jsx";
import { ProductCard } from "./product-card.jsx";
import { HomeExtras } from "./home-extras.jsx";
import { HomeReviews } from './home-reviews.jsx';
import { FounderStoryPreview } from "./brand-story.jsx";

const edits = [
  {
    title: "Beautiful sarees for\nevery celebration.",
    eyebrow: "THE SAREE EDIT",
    text: "Six yards of colour. A lifetime of beautiful moments.",
    left: "/images/ivory.jpg",
    right: "/images/yellow.jpg",
    link: "#/collections/sarees",
    action: "Explore sarees",
    tone: "gold",
  },
  {
    title: "Wedding & festive\nlehengas.",
    eyebrow: "THE OCCASION EDIT",
    text: "Lehengas that make every entrance a little more memorable.",
    left: "/images/blue.jpg",
    right: "/images/charcoal.jpg",
    link: "#/collections/lehengas",
    action: "Explore lehengas",
    tone: "navy",
  },
  {
    title: "Elegant kurta sets\nfor every day.",
    eyebrow: "THE KURTA EDIT",
    text: "Easy silhouettes. Beautiful details. Entirely you.",
    left: "/images/kurta.jpg",
    right: "/images/emerald.jpg",
    link: "#/collections/kurta-sets",
    action: "Explore kurta sets",
    tone: "rose",
  },
];

function CampaignCarousel() {
  const { content } = useStore();
  const custom = content.filter((item) => item.kind === "banner");
  const slides = custom.length
    ? custom.map((item) => ({
        title: item.title,
        eyebrow: "THE RAJO EDIT",
        text: item.body,
        image: item.imageUrl,
        alt: item.alt,
        link: item.link || "#/collections/all",
        action: "Shop the edit",
        tone: "custom",
      }))
    : edits;
  const [index, setIndex] = useState(0);
  const current = index % slides.length;
  const slide = slides[current];
  const move = (direction) =>
    setIndex((current + direction + slides.length) % slides.length);
  return (
    <section
      className={"campaign-carousel campaign-" + slide.tone}
      aria-label="Featured collections"
      aria-roledescription="carousel"
    >
      <div className="campaign-stage" key={current}>
        {slide.left && (
          <img
            className="campaign-photo campaign-left"
            src={slide.left}
            alt="Style from the featured RAJO collection"
            fetchPriority="high"
          />
        )}
        {slide.image && (
          <img
            className="campaign-custom-photo"
            src={slide.image}
            alt={slide.alt || slide.title}
            fetchPriority="high"
          />
        )}
        <div className="campaign-copy">
          <span className="eyebrow">{slide.eyebrow}</span>
          <h1>
            {slide.title.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {i > 0 ? <em>{line}</em> : line}
              </React.Fragment>
            ))}
          </h1>
          <p>{slide.text}</p>
          <a href={slide.link} className="campaign-shop">
            {slide.action} <ArrowUpRight size={17} />
          </a>
          <span className="campaign-signature">
            RAJO THREADS · TRADITION, REIMAGINED
          </span>
        </div>
        {slide.right && (
          <img
            className="campaign-photo campaign-right"
            src={slide.right}
            alt="Style from the featured RAJO collection"
            fetchPriority="high"
          />
        )}
      </div>
      {slides.length > 1 && (
        <>
          <button
            className="campaign-arrow previous"
            aria-label="Previous collection"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="campaign-arrow next"
            aria-label="Next collection"
            onClick={() => move(1)}
          >
            <ChevronRight size={22} />
          </button>
          <div className="campaign-pagination">
            {slides.map((item, i) => (
              <button
                key={i}
                aria-label={"Show collection " + (i + 1)}
                aria-pressed={i === current}
                onClick={() => setIndex(i)}
              >
                <span />
              </button>
            ))}
            <span className="campaign-count" aria-live="polite">
              {String(current + 1).padStart(2, "0")} /{" "}
              {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

function SectionHeading({ eyebrow, title, text, link, label = "View all" }) {
  return (
    <div className="fashion-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {link && (
        <a href={link}>
          {label}
          <ArrowUpRight size={15} />
        </a>
      )}
    </div>
  );
}

function CollectionRail({
  title,
  eyebrow,
  text,
  items,
  link,
  wish,
  toggleWish,
  add,
}) {
  const [position, setPosition] = useState(0);
  const canMove = items.length > 4;
  const visible = canMove
    ? Array.from({ length: 4 }, (_, i) => items[(position + i) % items.length])
    : items;
  if (!items.length) return null;
  return (
    <section className="fashion-collection page-width">
      <SectionHeading eyebrow={eyebrow} title={title} text={text} link={link} />
      <div
        className="fashion-product-grid product-grid"
        style={{ "--desktop-columns": Math.min(4, visible.length) }}
      >
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            wish={wish}
            toggleWish={toggleWish}
            add={add}
          />
        ))}
      </div>
      <div className="collection-controls">
        <a className="fashion-outline" href={link}>
          View the collection
          <ArrowRight size={16} />
        </a>
        {canMove && (
          <div>
            <button
              aria-label={"Previous " + title + " products"}
              onClick={() =>
                setPosition((position - 1 + items.length) % items.length)
              }
            >
              <ChevronLeft size={19} />
            </button>
            <button
              aria-label={"Next " + title + " products"}
              onClick={() => setPosition((position + 1) % items.length)}
            >
              <ChevronRight size={19} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function FashionHome({ products, wish, toggleWish, add, onSearch }) {
  const { settings } = useStore();
  const shared = { wish, toggleWish, add };
  const categories = [
    ["Sarees", "sarees", "pink", "Six yards of elegance"],
    ["Lehengas", "lehengas", "blue", "Made for the moment"],
    ["Kurta sets", "kurta-sets", "emerald", "Everyday, elevated"],
    ["New arrivals", "new-arrivals", "magenta", "A fresh point of view"],
  ];
  return (
    <div className="fashion-home">
      <CampaignCarousel />
      <div className="store-assurances">
        {[
          [
            MessageCircle,
            "Personal assistance",
            "We’re here to help",
            "#/contact",
          ],
          [Heart, "Chosen with care", "Details worth falling for", "#/about"],
          [
            PackageCheck,
            "Follow your order",
            "Updates in your account",
            "#/account",
          ],
          [
            ShoppingBag,
            settings.codEnabled
              ? "Cash on delivery"
              : "Explore your favourites",
            settings.codEnabled
              ? "Pay when your order arrives"
              : "Save the pieces you love",
            settings.codEnabled ? "#/shipping" : "#/collections/all",
          ],
        ].map(([Icon, title, detail, link]) => (
          <a href={link} key={title}>
            <Icon size={25} strokeWidth={1.25} />
            <span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </span>
          </a>
        ))}
      </div>
      <section className="fashion-categories page-width">
        <SectionHeading
          eyebrow="DISCOVER RAJO"
          title="Shop by category"
          text="Find something beautiful for every part of your day."
        />
        <div className="fashion-category-grid">
          {categories.map(([name, slug, image, caption]) => (
            <a href={"#/collections/" + slug} key={slug}>
              <div>
                <img
                  src={"/images/" + image + ".jpg"}
                  alt={name}
                  loading="lazy"
                />
                <span>
                  Explore <ArrowUpRight size={16} />
                </span>
              </div>
              <h3>{name}</h3>
              <p>{caption}</p>
            </a>
          ))}
        </div>
      </section>
      <CollectionRail
        title="Fresh arrivals"
        eyebrow="JUST ADDED TO YOUR WARDROBE"
        text="New colours, new details, a little more you."
        items={products.filter((p) => p.tag === "NEW ARRIVAL")}
        link="#/collections/new-arrivals"
        {...shared}
      />
      <section className="occasion-shopping">
        <SectionHeading
          eyebrow="FOR THE MOMENTS THAT MATTER"
          title="Dress for the occasion"
        />
        <div className="occasion-shopping-grid">
          {[
            [
              "Wedding celebrations",
              "For the moments you’ll remember.",
              "charcoal",
              "lehengas",
            ],
            [
              "Festive gatherings",
              "A little colour. A lot of celebration.",
              "yellow",
              "sarees",
            ],
            [
              "Everyday favourites",
              "Beautifully dressed, effortlessly you.",
              "kurta",
              "kurta-sets",
            ],
          ].map(([name, text, img, category]) => (
            <a key={name} href={"#/collections/" + category}>
              <img src={"/images/" + img + ".jpg"} alt={name} loading="lazy" />
              <div>
                <h3>{name}</h3>
                <p>{text}</p>
                <span>
                  Shop the edit <ArrowUpRight size={16} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <CollectionRail
        title="The saree collection"
        eyebrow="TRADITION IN EVERY THREAD"
        text="From quiet elegance to a beautiful celebration."
        items={products.filter((p) => p.category === "Sarees")}
        link="#/collections/sarees"
        {...shared}
      />
      <section className="fashion-wide-banner">
        <img
          src="/images/floral.jpg"
          alt="Floral lehenga from the RAJO collection"
          loading="lazy"
        />
        <div>
          <span className="eyebrow">THE CELEBRATION WARDROBE</span>
          <h2>
            A little grandeur.
            <br />
            <em>A lot of you.</em>
          </h2>
          <p>Discover lehengas made for your next special moment.</p>
          <a href="#/collections/lehengas" className="campaign-shop">
            Discover lehengas
            <ArrowUpRight size={17} />
          </a>
        </div>
        <img
          src="/images/blue.jpg"
          alt="Teal embroidered lehenga"
          loading="lazy"
        />
      </section>
      <CollectionRail
        title="Everyday elegance"
        eyebrow="THE KURTA SET COLLECTION"
        text="Your easy favourites, with a little RAJO detail."
        items={products.filter((p) => p.category === "Kurta sets")}
        link="#/collections/kurta-sets"
        {...shared}
      />
      <section className="fashion-colours page-width">
        <SectionHeading
          eyebrow="FIND YOUR COLOUR STORY"
          title="A shade for every you"
        />
        <div>
          {[
            ["Yellow", "#d5a72e"],
            ["Pink", "#c87489"],
            ["Ivory", "#e5dac2"],
            ["Teal", "#2e787b"],
            ["Purple", "#8c719e"],
            ["Terracotta", "#a5583f"],
          ].map(([name, colour]) => (
            <button key={name} onClick={() => onSearch(name)}>
              <i style={{ background: colour }} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="fashion-story">
        <FounderStoryPreview />
      </div>
      <HomeExtras />
      <HomeReviews />
    </div>
  );
}
