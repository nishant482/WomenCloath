import {sizeLabel} from "./catalogue-options.js";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Star,
  UserRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { api, productImage } from "./api.js";
import { useStore } from "./store-context.jsx";
import "./auth-design.css";
import { CustomerAccount } from "./customer-account.jsx";
import { AddressFields } from "./address-fields.jsx";
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
export function AuthForm({ onLogin, admin = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [legacyEmail, setLegacyEmail] = useState(false);
  const [mode, setMode] = useState("login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [email, setEmail] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    if (mode === 'signup') body.emailUpdates = body.emailUpdates === 'on';
    try {
      const result = await api("/auth/" + mode, { method: "POST", body });
      setMessage(result.message || "");
      if (mode === "login" || (mode === "signup" && result.user)) {
        if (admin && result.user.role !== "admin") {
          await api("/auth/logout", { method: "POST" });
          throw new Error("This account does not have administrator access.");
        }
        await onLogin(result.user);
      }
      if (mode === "signup" && !result.user) setMode("verify");
      if (mode === "verify" || mode === "reset") setMode("login");
      if (mode === "forgot") setMode("reset");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const switchMode = (m) => {
    setMode(m);
    setError("");
    setMessage("");
  };
  return (
    <div className={admin ? "auth-admin-shell" : "auth-experience"}>
    <section className="account-auth auth-card">
      {!admin && ["login", "signup"].includes(mode) && <div className="auth-mode-switch" aria-label="Account access">
        <button type="button" aria-label="Switch to sign in" aria-pressed={mode === "login"} onClick={() => switchMode("login")}>Sign in</button>
        <button type="button" aria-pressed={mode === "signup"} onClick={() => switchMode("signup")}>Create an account</button>
      </div>}
      <div className="eyebrow">
        {admin ? "RAJO STUDIO" : "WELCOME TO THE RAJO FAMILY"}
      </div>
      <h1>
        {
          {
            login: "Welcome back.",
            signup: "Create your account.",
            verify: "Check your inbox.",
            forgot: "Forgot your password?",
            reset: "A fresh start.",
          }[mode]
        }
      </h1>
      <p>
        {mode === "verify"
          ? "Enter the six-digit email code and choose the password for your verified account."
          : mode === "signup"
            ? "Create an account to save your favourites and follow your orders."
            : admin
              ? "Sign in to manage your products, orders and customers."
              : "Your favourites, your orders, all in one place."}
      </p>
      <form className="commerce-form" onSubmit={submit}>
        {mode === 'signup' && <label className="email-preference"><input name="emailUpdates" type="checkbox" defaultChecked />Email me new arrivals from RAJO Threads. Unsubscribe anytime.</label>}
        {mode === "signup" && (
          <label>
            Full name
            <input
              name="name"
              minLength={2}
              maxLength={100}
              required
              autoComplete="name"
              placeholder="Your full name"
            />
          </label>
        )}
        {!admin && (mode === 'signup' || (mode === 'login' && !legacyEmail)) && <label>Mobile number<input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile number" required /></label>}
        {(admin || mode !== 'login' || legacyEmail) && <label>
          Email address
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>}
        {["verify", "reset"].includes(mode) && (
          <label>
            Verification code
            <input
              name="code"
              pattern="[0-9]{6}"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </label>
        )}
        {mode !== "forgot" && (
          <label>
            {["verify", "reset"].includes(mode)
              ? "Choose password"
              : "Password"}
            <span className="auth-password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={
                  mode === "login"
                    ? "Enter your password"
                    : "Choose a secure password"
                }
                aria-label={
                  ["verify", "reset"].includes(mode)
                    ? "Choose password"
                    : "Password"
                }
                minLength={mode === "login" ? 1 : 10}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            {mode !== "login" && (
              <small>Use at least 10 characters for a new password.</small>
            )}
          </label>
        )}
        {error && (
          <p className="commerce-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="commerce-success" role="status">
            {message}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy
            ? "Please wait…"
            : {
                login: "Sign in",
                signup: "Create account",
                verify: "Verify email",
                forgot: "Send reset code",
                reset: "Reset password",
              }[mode]}
          <ArrowRight size={17} />
        </button>
      </form>
      <div className="auth-links">
        {!admin && mode === 'login' && <button onClick={() => setLegacyEmail(!legacyEmail)}>{legacyEmail ? 'Sign in with mobile number' : 'Existing account without a mobile? Use email'}</button>}
        {mode !== "login" && (
          <button onClick={() => switchMode("login")}>Back to sign in</button>
        )}
        {mode === "login" && (
          <>
            <button onClick={() => switchMode("forgot")}>
              Forgot password?
            </button>
          </>
        )}
        {mode === "verify" && (
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await api("/auth/resend", {
                  method: "POST",
                  body: { email },
                });
                setMessage(r.message);
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Resend code
          </button>
        )}
      </div>
      {!admin && <p className="auth-footer-note">Beautiful styles. A simpler shopping experience.</p>}
    </section>
    </div>
  );
}
export function AccountPage() {
  const store = useStore();
  return <CustomerAccount auth={<AuthForm onLogin={store.onLogin} />} />;
}
export function CheckoutPage() {
  const store = useStore();
  const directId = Number(new URLSearchParams(location.search).get('product'));
  const direct = store.products.find(p => p.id === directId);
  const [size, setSize] = useState('');
  const items = direct ? [{ productId: direct.id, qty: 1, size }] : store.bag.map(p => ({ productId: p.id, qty: p.qty, size: p.size || '' }));
  const needsSize = direct?.sizes?.length > 0 && !size;
  const guest = !store.user;
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [quote, setQuote] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [order, setOrder] = useState(null);
  const key = useRef(crypto.randomUUID());
  const quoteRequest = useRef(0);
  const load = async () => {
    const requestId = ++quoteRequest.current;
    if (needsSize) { setQuote(null); setBusy(false); return; }
    setError("");
    setBusy(true);
    try {
      const q = await api(guest ? "/checkout/guest/quote" : "/checkout/quote", {
        method: "POST",
        body: { ...((guest || direct) ? { items } : {}) },
      });
      if (requestId !== quoteRequest.current) return;
      setQuote(q);
    } catch (e) {
      if (requestId !== quoteRequest.current) return;
      setError(e.message);
      setQuote(null);
    } finally {
      if (requestId === quoteRequest.current) setBusy(false);
    }
  };
  useEffect(() => {
    if (!order) load();
  }, [store.user?.id, size, directId]);
  if (directId && !direct) return <section className="checkout-page page-width"><h1>Product unavailable</h1><a className="primary" href="/collections/all">Continue shopping</a></section>;
  if (order)
    return (
      <section className="checkout-success page-width">
        <CheckCircle size={48} />
        <h1>Thank you, {order.customer}.</h1>
        <p>
          Your order <strong>{order.number}</strong> has been placed.
        </p>
        <p>Pay {money(order.total)} on delivery.</p>
        {guest && <p>Save your order number for updates. Contact us on WhatsApp for help with your order.</p>}
        <a className="primary" href={guest ? '/collections/all' : '/account'}>
          {guest ? 'Continue shopping' : 'View your orders'} <ArrowRight size={18} />
        </a>
      </section>
    );
  return (
    <section className="checkout-page page-width">
      <div className="eyebrow">ONE STEP CLOSER</div>
      <h1>Make it yours.</h1>
      {guest && <p>Guest checkout · No account needed. Enter your delivery details to place your order.</p>}
      {direct && <div className="direct-checkout-product"><img src={productImage(direct)} alt={direct.name} /><div><h2>{direct.name}</h2><p>{money(direct.price)}</p>{direct.sizes?.length > 0 && <label>Choose your size<select value={size} onChange={e => { setSize(e.target.value); key.current = crypto.randomUUID(); }} required><option value="">Select size</option>{direct.sizes.map(s => <option key={s} value={s}>{sizeLabel(s)}</option>)}</select></label>}</div></div>}
      {error && (
        <p className="commerce-error" role="alert">
          {error}
        </p>
      )}
      <div className="checkout-layout">
        <form
          className="commerce-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const a = Object.fromEntries(new FormData(e.currentTarget));
              const result = await api(guest ? "/checkout/guest/orders" : "/orders", {
                method: "POST",
                headers: { "Idempotency-Key": key.current },
                body: { address: { ...a, country: "India" }, ...((guest || direct) ? { items } : {}), ...(guest && a.email ? { email: a.email } : {}) },
              });
              setOrder(result);
              if (guest && !direct) await store.setBag([]);
              await store.refreshBag();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Delivery details</h2>
          {store.user?.addresses?.length > 0 && <label>Saved address<select aria-label="Saved address" value={selectedAddress} onChange={e => setSelectedAddress(Number(e.target.value))}>{store.user.addresses.map((a, i) => <option key={i} value={i}>{a.line1}, {a.city} – {a.postalCode}</option>)}<option value={-1}>Use a new address</option></select></label>}
          <AddressFields key={selectedAddress} initial={{ name: store.user?.name, phone: store.user?.phone, ...store.user?.addresses?.[selectedAddress] }} />
          {guest && <label>Email address (optional)<input name="email" type="email" autoComplete="email" /></label>}
          <p>
            Payment: <strong>Cash on delivery</strong>. Online payments are not
            enabled.
          </p>
          <p>
            <a href="/shipping">Shipping & return policy</a>
          </p>
          <button className="primary" disabled={busy || needsSize || !quote?.codEnabled}>
            {busy ? "Please wait…" : "Place order"}
            <ArrowRight size={18} />
          </button>
          {quote && !quote.codEnabled && (
            <p>Checkout is temporarily unavailable.</p>
          )}
        </form>
        <aside className="checkout-summary">
          <h2>Your bag</h2>
          {quote?.items.map((p, i) => (
            <div className="order-item" key={i}>
              <img src={productImage(p)} alt={p.name} />
              <div>
                {p.name}
                <p>
                  {p.size && `Size ${p.size} · `}Qty {p.qty} ·{" "}
                  {money(p.lineTotal)}
                </p>
              </div>
            </div>
          ))}
          {quote && (
            <dl>
              {[
                ["Subtotal", quote.subtotal],
                ["Shipping", quote.shipping],
                ["COD charge", quote.codFee || 0],
                ["Total", quote.total],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{money(value)}</dd>
                </div>
              ))}
            </dl>
          )}
          <button
            className="text-link"
            disabled={busy}
            onClick={() => load(applied)}
          >
            Refresh totals
          </button>
        </aside>
      </div>
    </section>
  );
}
export const sampleReviews = [
  { _id: "sample-4", name: "Kavya M.", rating: 4, title: "Simple styling works best", body: "Styled this with small jhumkas and flats for a family lunch. The outfit has enough detail on its own. A little steaming before wearing helped the drape.", isDemo: true },
  { _id: "sample-5", name: "Nidhi R.", rating: 5, title: "Loved the overall look", body: "The colour combination was my favourite part. It looks dressed up without needing too many accessories, which is exactly the style I enjoy.", isDemo: true },
  { _id: "sample-6", name: "Simran A.", rating: 4, title: "A lovely festive option", body: "Pretty detailing and an elegant silhouette. I would recommend checking the size chart carefully for your preferred fit. Looks especially nice with neutral sandals.", isDemo: true },
  { _id: "sample-1", name: "Ananya S.", rating: 5, title: "Lovely colours and beautiful detailing", body: "The colours look lovely in daylight, and the detailing gives the outfit a festive feel. An easy choice for a family celebration.", isDemo: true },
  { _id: "sample-2", name: "Meera K.", rating: 4, title: "Comfortable for a long celebration", body: "The fabric feels comfortable and the finish is neat. I would pair it with simple jewellery to let the outfit stand out.", isDemo: true },
  { _id: "sample-3", name: "Riya P.", rating: 5, title: "A beautiful addition to my wardrobe", body: "I love the combination of traditional details and a simple, elegant look. A style I can imagine wearing for more than one occasion.", isDemo: true },
];

export function ProductReviews({ productId }) {
  const { user } = useStore();
  const [data, setData] = useState({ items: [], count: 0, average: 0 }),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setData({ items: [], count: 0, average: 0 });
    setError("");
    setMessage("");
    api("/products/" + productId + "/reviews")
      .then((result) => { if (active) setData(result); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [productId]);
  const items = data.items.length ? data.items : sampleReviews;
  const sampleOnly = items.every((item) => item.isDemo);
  const average = items.reduce((sum, item) => sum + item.rating, 0) / items.length;
  return (
    <section className="product-reviews page-width">
      <div className="eyebrow">FROM THE RAJO COMMUNITY</div>
      <h2>Customer Ratings & Reviews</h2>
      {sampleOnly && <p className="review-demo-note">Sample reviews for preview purposes.</p>}
      <div className="reviews-layout">
        <aside className="reviews-summary" aria-label="Ratings summary">
          <strong>{(data.count ? data.average : average).toFixed(1)}<span> / 5</span></strong>
          <div className="review-stars" aria-hidden="true">★★★★★</div>
          <p>{data.count || items.length} {sampleOnly ? "sample reviews" : "customer reviews"}</p>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = items.filter((item) => item.rating === rating).length;
            return <div className="rating-row" key={rating}><span>{rating} ★</span><meter min="0" max={items.length} value={count} aria-label={`${rating} stars: ${count} reviews`} /><span>{count}</span></div>;
          })}
        </aside>
        <div className="reviews-list">
      {items.map((r) => (
        <article className="review-card" key={r._id}>
          <div
            className="review-stars"
            aria-label={r.rating + " out of 5 stars"}
          >
            {"★".repeat(r.rating)}
            {"☆".repeat(5 - r.rating)}
          </div>
          <h3>{r.title}</h3>
          <p>{r.body}</p>
          <small>
            {r.name}
            {!r.isDemo && <> · {r.verifiedPurchase ? "Verified purchase" : "Customer review"}</>}
          </small>
        </article>
      ))}
        </div>
      </div>
      {error && (
        <p className="commerce-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="commerce-success" role="status">
          {message}
        </p>
      )}
      {user ? (
        <details>
          <summary>Write a review</summary>
          <form
            className="commerce-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const body = Object.fromEntries(new FormData(e.currentTarget));
                const r = await api("/products/" + productId + "/reviews", {
                  method: "POST",
                  body: { ...body, rating: Number(body.rating) },
                });
                setMessage(r.message);
                e.target.reset();
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Rating
              <select name="rating">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} stars
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input name="title" required minLength={3} maxLength={120} />
            </label>
            <label>
              Your experience
              <textarea name="body" required minLength={10} maxLength={2000} />
            </label>
            <button className="primary" disabled={busy}>
              Submit review
            </button>
          </form>
        </details>
      ) : (
        <a className="text-link" href="/account">
          Sign in to write a review <ArrowRight size={16} />
        </a>
      )}
    </section>
  );
}
