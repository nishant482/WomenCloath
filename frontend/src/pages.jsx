import { CONTACT_EMAIL } from "./brand-config.js";
import {ProductGallery} from './product-gallery.jsx';
import { api, productImage } from "./api.js";
import { ProductReviews } from "./account.jsx";
import { useStore } from "./store-context.jsx";
import { CustomerGallery } from "./customer-gallery.jsx";
import { BrandStoryPage } from "./brand-story.jsx";
import {sizeLabel,categorySlug} from "./catalogue-options.js";
import React, { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Sparkles,
  Check,
  Mail,
  MessageCircle,
} from "lucide-react";
const money = (n) => `₹${n.toLocaleString("en-IN")}`;
export function PageBanner({
  eyebrow,
  title,
  text,
  image = "https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/891a7c10-6620-4c62-be2b-01b77e7b3f81.jpg",
}) {
  return (
    <section className="page-banner">
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>{title}</span>
      </div>
      <div className="page-banner-content">
        <div className="page-banner-copy">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        <div className="page-banner-portrait" aria-hidden="true">
          <img src={image} alt="" />
          <span>Thoughtfully chosen. Beautifully you.</span>
        </div>
      </div>
    </section>
  );
}
export function CategoryStories({ shop }) {
  return (
    <section className="category-stories">
      <div className="section-heading">
        <div>
          <div className="eyebrow">YOUR WARDROBE, YOUR WAY</div>
          <h2>
            Find your <em>kind of beautiful.</em>
          </h2>
        </div>
        <span className="section-note">
          Find your everyday. And your extraordinary.
        </span>
      </div>
      <div className="category-grid">
        {[
          ["Sarees", "Six yards. Endless stories.", "pink"],
          ["Lehengas", "Made for your main moment.", "charcoal"],
          ["Kurta sets", "A little effortless elegance.", "emerald"],
        ].map(([name, text, img]) => (
          <a
            className="category-card"
            key={name}
            href={"/collections/" + name.toLowerCase().replaceAll(" ", "-")}
          >
            <img src={assetUrl(`/images/${img}.jpg`)} alt={name} loading="lazy" />
            <div>
              <small>{text}</small>
              <h3>
                {name}
                <ArrowUpRight />
              </h3>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
export function OccasionEdit({ shop }) {
  return (
    <>
      <section className="colour-strip">
        <span>COLOUR OUTSIDE THE EVERYDAY</span>
        <span>✳</span>
        <span>WEAR YOUR HAPPY</span>
        <span>✳</span>
        <span>CELEBRATE YOUR WAY</span>
      </section>
      <section className="occasion-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">A MOMENT FOR EVERY MOOD</div>
            <h2>
              Plans worth <em>dressing up for.</em>
            </h2>
          </div>
          <button className="text-link" onClick={() => shop()}>
            Discover your occasion <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="occasion-grid">
          <a href="/collections/lehengas">
            <img
              src="https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/14b7f90d-57b4-4eb1-ad32-29392da2be19.jpg"
              alt="Floral lehenga for a wedding celebration"
              loading="lazy"
            />
            <div>
              <span>THE WEDDING GUEST EDIT</span>
              <h3>For the moments that stay.</h3>
              <span>
                Explore lehengas <ArrowRight size={18} />
              </span>
            </div>
          </a>
          <a href="/collections/kurta-sets">
            <img
              src="https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/4e440f9a-207b-4460-bef6-71ea20cc7814.jpg"
              alt="Printed kurta for beautiful everyday moments"
              loading="lazy"
            />
            <div>
              <span>THE EVERYDAY EDIT</span>
              <h3>Everyday, beautifully.</h3>
              <span>
                Explore kurta sets <ArrowRight size={18} />
              </span>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
function ProductPage({
  product: p,
  products,
  add,
  wish,
  toggleWish,
  openProduct,
}) {
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const stitched = Boolean(p.sizes?.length);
  return (
    <>
      <div className="breadcrumb page-width">
        <a href="/">Home</a>
        <span>/</span>
        <a
          href={
            "/collections/" + categorySlug(p.category)
          }
        >
          {p.category}
        </a>
        <span>/</span>
        <span>{p.name}</span>
      </div>
      <section className="product-page page-width">
        <ProductGallery key={p.id} product={p}/>
        <div className="product-information">
          <div className="eyebrow">THE RAJO THREADS COLLECTION</div>
          <h1>{p.name}</h1>
          <p>{p.fabric}</p>
          <div className="detail-price">
            {money(p.price)}{" "}
            {p.old > p.price && (
              <>
                <del>{money(p.old)}</del>
                <span>{Math.round((1 - p.price / p.old) * 100)}% OFF</span>
              </>
            )}
          </div>
          <small className="tax-note">Tax included. Shipping calculated at checkout</small>
          <div className="product-divider" />
          {p.description && (
            <p className="product-description">{p.description}</p>
          )}
          <p>
            A little colour, a beautiful detail, and a silhouette you’ll reach
            for again. This{" "}
            {p.category === "Sarees"
              ? "saree"
              : p.category === "Lehengas"
                ? "lehenga"
                : p.category === "Kurta sets" ? "kurta set" : "style"}{" "}
            brings an effortless sense of occasion to your wardrobe.
          </p>
          <div className="product-choice">
            <strong>{stitched ? "Select a size" : "Fit & finish"}</strong>
            {stitched ? (
              <div className="size-options">
                {p.sizes.map((v) => (
                  <button
                    key={v}
                    aria-pressed={size === v}
                    onClick={() => {
                      setSize(v);
                      setSizeError(false);
                    }}
                    className={size === v ? "active" : ""}
                  >
                    {sizeLabel(v)}
                  </button>
                ))}
              </div>
            ) : (
              <p>
                {p.category === "Sarees"
                  ? "Free size · Unstitched blouse piece included"
                  : p.category === "Lehengas" ? "Semi-stitched · Blouse fabric and dupatta included" : "Free size · See the product description for fit details"}
              </p>
            )}
            {sizeError && (
              <p className="field-error" role="alert">
                Please select a size to add this set.
              </p>
            )}
          </div>
          <div className="detail-actions">
            <button
              className="primary"
              disabled={p.stock < 1}
              onClick={() => {
                if (stitched && !size) {
                  setSizeError(true);
                  return;
                }
                add({ ...p, ...(stitched ? { size } : {}) });
              }}
            >
              {p.stock > 0 ? "Add to bag" : "Out of stock"}{" "}
              <ShoppingBag size={19} />
            </button>
            <button
              className={"detail-wish " + (wish.includes(p.id) ? "saved" : "")}
              aria-label="Save this product"
              aria-pressed={wish.includes(p.id)}
              onClick={() => toggleWish(p.id)}
            >
              <Heart fill={wish.includes(p.id) ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="shopping-availability">
            {p.stock > 0
              ? "Available now. Choose your favourite and add it to your bag."
              : "This style is currently out of stock."}
          </p>
          <div className="product-promises">
            <span>
              <Sparkles size={18} /> Fabric & fit details below
            </span>
            <span>
              <ShieldCheck size={18} /> Thoughtfully selected details
            </span>
          </div>
          <details open>
            <summary>Product details</summary>
            <p>
              {p.fabric}.{" "}
              {p.category === "Sarees"
                ? "Saree length: 5.5 metres. Blouse piece: 0.8 metres."
                : p.category === "Lehengas"
                  ? "Includes a semi-stitched lehenga, unstitched blouse fabric and a coordinating dupatta."
                  : p.category === "Kurta sets" ? "Includes a tunic or kurta with coordinating bottoms. Select your preferred size above." : "See the product description for fabric, fit and included pieces."}{" "}
              Jewellery and accessories shown are styling suggestions.
            </p>
          </details>
          <details>
            <summary>Care for your colours</summary>
            <p>
              Dry clean only. Store in a cool, dry place, away from direct
              sunlight. Iron on a low setting through a protective cloth.
            </p>
          </details>
          <details>
            <summary>Shipping & returns</summary>
            <p>
              Shipping charges are calculated at checkout. See our{" "}
              <a href="/shipping">shipping information</a> for more.
            </p>
          </details>
        </div>
      </section>
      <ProductReviews productId={p.id} />
      <section className="related page-width">
        <div className="eyebrow">KEEP EXPLORING</div>
        <h2>
          A few more <em>you might love.</em>
        </h2>
        <div className="related-grid">
          {products
            .filter((x) => x.id !== p.id)
            .sort(
              (a, b) =>
                Number(b.category === p.category) -
                Number(a.category === p.category),
            )
            .slice(0, 4)
            .map((x) => (
              <a className="related-card" key={x.id} href={"/product/" + x.id}>
                <img src={productImage(x)} alt={x.name} loading="lazy" />
                <h3>{x.name}</h3>
                <p>{money(x.price)}</p>
              </a>
            ))}
        </div>
      </section>
    </>
  );
}
function ContactPage() {
  const { settings } = useStore();
  const contactEmail = settings.contactEmail || CONTACT_EMAIL;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageBanner
        eyebrow="WE’RE ALL EARS"
        title="Let’s talk colour."
        text="A question, a little feedback, or just a hello. We’d love to hear from you."
      />
      <section className="contact-layout page-width">
        <div>
          <div className="eyebrow">A LITTLE CONVERSATION</div>
          <h2>
            Good things start
            <br />
            <em>with hello.</em>
          </h2>
          <p>
            Wondering about a style, a fabric, or how to put a look together?
            Leave a note in the form.
          </p>
          <div className="contact-note">
            <MessageCircle />
            <div>
              <h3>Style & collection questions</h3>
              <a
                href="https://wa.me/919716422466"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp · +91 97164 22466
              </a>
              <p>Tell us the product name and what you have in mind.</p>
            </div>
          </div>
          <div className="contact-note">
            <Mail />
            <div>
              <h3>Collaborations & feedback</h3>
              <a href={"mailto:" + contactEmail}>{contactEmail}</a>
              <p>We’re always happy to hear a fresh perspective.</p>
            </div>
          </div>
          <div className="demo-note">
            Prefer to connect now? Find RAJO Threads on Instagram or join our
            WhatsApp community using the links below, or send your enquiry here.
          </div>
        </div>
        <form
          className="contact-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("/enquiries", {
                method: "POST",
                body: Object.fromEntries(new FormData(e.currentTarget)),
              });
              setSent(true);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {sent ? (
            <div className="contact-success" role="status">
              <Check size={35} />
              <h2>Thanks for saying hello.</h2>
              <p>
                Your message has been received. The RAJO team will get back to
                you.
              </p>
              <button
                type="button"
                className="text-link"
                onClick={() => setSent(false)}
              >
                Write another note <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <h3>Send a little note</h3>
              <div className="form-row">
                <label>
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    placeholder="Full name"
                  />
                </label>
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </label>
              </div>
              <label>
                What’s on your mind?
                <select name="subject">
                  <option>Product & styling</option>
                  <option>Shipping & returns</option>
                  <option>Collaborations</option>
                  <option>Something else</option>
                </select>
              </label>
              <label>
                Your message
                <textarea
                  name="message"
                  required
                  rows="5"
                  placeholder="Tell us a little more…"
                />
              </label>
              {error && (
                <p role="alert" className="commerce-error">
                  {error}
                </p>
              )}
              <button className="primary" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send message"} <ArrowUpRight size={18} />
              </button>
            </>
          )}
        </form>
      </section>
      <section className="faq page-width">
        <div className="eyebrow">A FEW LITTLE ANSWERS</div>
        <h2>Before you ask.</h2>
        {[
          [
            "Can I place an order?",
            "Yes. Sign up, verify your email, add available styles to your bag and place a cash-on-delivery order. Online payment is not enabled.",
          ],
          [
            "Are the sarees ready to wear?",
            "Our sarees include an unstitched blouse piece unless stated otherwise. The product page explains the fit and included pieces.",
          ],
          [
            "Where can I find care instructions?",
            "Open any product page and expand “Care for your colours” for fabric-care guidance.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
export function InnerPage(props) {
  const { settings } = useStore();
  const { route, products } = props;
  if (route.startsWith("/product/")) {
    const p = products.find((x) => x.id === Number(route.split("/")[2]));
    if (p) return <ProductPage key={p.id} {...props} product={p} />;
  }
  if (route === "/rajo-family")
    return (
      <>
        <div className="breadcrumb page-width">
          <a href="/">Home</a>
          <span>/</span>
          <span>The RAJO family</span>
        </div>
        <CustomerGallery />
      </>
    );
  if (route === "/about") return <BrandStoryPage />;
  if (route === "/contact") return <ContactPage />;
  if (route === "/shipping")
    return (
      <>
        <PageBanner
          eyebrow="THE LITTLE DETAILS"
          title="From our wardrobe to yours."
          text="A little clarity about shipping, care and your shopping experience."
        />
        <section className="policy page-width">
          <h2>Shipping & returns</h2>
          <p>
            Browse the collection, sign in and place cash-on-delivery orders.
            Online payments are not enabled.
          </p>
          <h3>Delivery information</h3>
          <p>{settings.shippingPolicy}</p>
          <h3>Returns & exchanges</h3>
          <p>{settings.returnPolicy}</p>
          <a className="primary" href="/contact">
            Have a question? <ArrowUpRight size={18} />
          </a>
        </section>
      </>
    );
  return (
    <>
      <PageBanner
        eyebrow="A LITTLE DETOUR"
        title="This page has wandered off."
        text="There’s still plenty of colour waiting for you."
      />
      <div className="page-width not-found">
        <a className="primary" href="/">
          Back to home <ArrowRight size={18} />
        </a>
      </div>
    </>
  );
}
import { assetUrl } from './media.js';
