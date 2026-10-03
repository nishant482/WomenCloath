import React from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  Flower2,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Star,
  Boxes,
  Image,
  FileText,
  ChevronRight,
} from "lucide-react";
import { AuthForm } from "../src/account.jsx";
import { productImage } from "../src/api.js";

const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN");

export function StudioLogin({ onLogin, error }) {
  return (
    <main className="studio-entry">
      <section className="entry-art" aria-label="RAJO Threads collection">
        <img
          className="entry-photo"
          src="https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/2b388f57-da21-44a7-b222-738ebe9a3534.jpg"
          alt="Terracotta floral saree from the RAJO collection"
        />
        <a href="/" className="entry-brand">
          <img src="https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/0060c684-5752-4474-88b4-99a974a0d976.jpg" alt="RAJO Threads" />
          <span>
            RAJO<small>THREADS · STUDIO</small>
          </span>
        </a>
        <div className="entry-story">
          <span className="eyebrow">RAJO STORE MANAGEMENT</span>
          <h1>
            Your store.
            <br />
            <em>All in one place.</em>
          </h1>
          <p>
            Manage products, track orders,
            <br />
            and keep your business moving.
          </p>
        </div>
        <div className="entry-foot">
          <span>ROOTED IN TRADITION. MADE FOR TODAY.</span>
          <Flower2 size={25} strokeWidth={1} />
        </div>
      </section>
      <section className="entry-form">
        <a href="/" className="entry-back">
          <ArrowLeft size={16} /> Back to storefront
        </a>
        <div className="entry-center">
          <div className="entry-mark">
            <Flower2 size={27} strokeWidth={1.2} />
          </div>
          {error && (
            <p className="commerce-error" role="alert">
              {error}
            </p>
          )}
          <AuthForm admin onLogin={onLogin} />
          <div className="entry-note">
            <span />
            Your store. A little colour, a lot of possibility.
          </div>
        </div>
        <small className="entry-copyright">
          © {new Date().getFullYear()} RAJO Threads · Made with intention.
        </small>
      </section>
    </main>
  );
}

export function StudioOverview({ overview, user }) {
  const stats = [
    [
      "Collected revenue",
      money(overview.revenue),
      Wallet,
      "Completed payment collections",
    ],
    [
      "Orders",
      overview.orders,
      ShoppingBag,
      `${overview.pendingOrders ?? 0} to prepare`,
    ],
    ["Products", overview.products, Package, "Styles in your catalog"],
    ["Customers", overview.users, Users, "Your growing community"],
  ];
  return (
    <div className="studio-overview">
      <section className="studio-hero">
        <div className="studio-hero-copy">
          <span className="eyebrow">YOUR STORE AT A GLANCE</span>
          <h2>
            A fresh start.
            <br />
            <em>Ready for what’s next.</em>
          </h2>
          <p>
            Welcome back, {user.name.split(" ")[0]}. Keep track of your orders,
            update your products and manage your store from here.
          </p>
          <a href="#products">
            Manage products <ArrowRight size={17} />
          </a>
        </div>
        <div className="studio-hero-art">
          <span className="studio-art-orbit" />
          <img src="https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/de847675-bab8-49d1-ba7e-38df2ac1fd04.jpg" alt="Yellow embroidered saree" />
          <img src="https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/2b388f57-da21-44a7-b222-738ebe9a3534.jpg" alt="Terracotta floral saree" />
          <Flower2 className="studio-art-flower" size={58} strokeWidth={0.7} />
          <span className="studio-art-caption">
            THOUGHTFULLY CHOSEN.
            <br />
            BEAUTIFULLY YOURS.
          </span>
        </div>
      </section>
      <div className="studio-stats">
        {stats.map(([label, value, Icon, hint]) => (
          <article key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <i>
                <Icon size={18} strokeWidth={1.6} />
              </i>
            </div>
            <strong>{value ?? "—"}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </div>
      <div className="studio-dashboard-grid">
        <section className="studio-panel recent-orders">
          <div className="studio-panel-heading">
            <div>
              <span className="eyebrow">FROM YOUR STOREFRONT</span>
              <h3>Recent orders</h3>
            </div>
            <a href="#orders" className="studio-inline-link">
              View all <ArrowUpRight size={16} />
            </a>
          </div>
          {overview.recentOrders?.length ? (
            <div className="recent-order-list">
              {overview.recentOrders.map((order) => (
                <a key={order._id} href="#orders">
                  <span className="order-initial">
                    {order.customer?.[0] || "R"}
                  </span>
                  <span>
                    <strong>{order.customer}</strong>
                    <small>{order.number}</small>
                  </span>
                  <span className="status-pill" data-status={order.status}>
                    {order.status}
                  </span>
                  <b>{money(order.total)}</b>
                  <ChevronRight size={16} />
                </a>
              ))}
            </div>
          ) : (
            <div className="studio-order-empty">
              <div>
                <ShoppingBag size={26} strokeWidth={1.2} />
              </div>
              <h4>Your next chapter starts here.</h4>
              <p>New orders will appear here, ready for a little RAJO care.</p>
              <a href="/" className="studio-inline-link">
                Visit your storefront <ArrowUpRight size={16} />
              </a>
            </div>
          )}
        </section>
        <section className="studio-panel attention-panel">
          <div className="studio-panel-heading">
            <div>
              <span className="eyebrow">THE LITTLE THINGS</span>
              <h3>A moment of attention</h3>
            </div>
            <Flower2 size={24} strokeWidth={1} />
          </div>
          <a href="#products" className="studio-task">
            <i>
              <Boxes size={21} />
            </i>
            <span>
              <strong>{overview.lowStock ?? 0} styles running low</strong>
              <small>Keep your favourites ready to shop.</small>
            </span>
            <ChevronRight size={17} />
          </a>
          <a href="#reviews" className="studio-task">
            <i>
              <Star size={21} />
            </i>
            <span>
              <strong>{overview.pendingReviews ?? 0} reviews to read</strong>
              <small>A little love from your community.</small>
            </span>
            <ChevronRight size={17} />
          </a>
          <a href="#orders" className="studio-task">
            <i>
              <ShoppingBag size={21} />
            </i>
            <span>
              <strong>{overview.pendingOrders ?? 0} orders to prepare</strong>
              <small>Make their next delivery special.</small>
            </span>
            <ChevronRight size={17} />
          </a>
        </section>
      </div>
      <section className="studio-panel studio-collection-panel">
        <div className="studio-panel-heading">
          <div>
            <span className="eyebrow">YOUR COLLECTION, AT A GLANCE</span>
            <h3>Beautiful things in the making.</h3>
          </div>
          <a href="#products" className="studio-inline-link">
            Manage styles <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="studio-product-preview">
          {overview.featuredProducts?.map((product) => (
            <a key={product.id} href="#products">
              <img src={productImage(product)} alt={product.name} />
              <div>
                <small>{product.category}</small>
                <h4>{product.name}</h4>
                <span>{money(product.price)}</span>
                <small className="inventory-label">
                  {product.stock} available
                </small>
              </div>
            </a>
          ))}
        </div>
        {!overview.featuredProducts?.length && (
          <p className="studio-empty">
            Your collection is waiting to take shape.{" "}
            <a href="#products">Add your first style.</a>
          </p>
        )}
      </section>
      <div className="studio-quick-links">
        {[
          [
            "banners",
            "Set the scene",
            "Refresh your storefront banners.",
            Image,
          ],
          [
            "blogs",
            "Tell your story",
            "Give your community something to read.",
            FileText,
          ],
          [
            "family",
            "Celebrate your people",
            "Add a moment to the RAJO family.",
            Users,
          ],
        ].map(([path, title, text, Icon]) => (
          <a href={"#" + path} key={path}>
            <Icon size={22} strokeWidth={1.4} />
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
            <ArrowUpRight size={19} />
          </a>
        ))}
      </div>
    </div>
  );
}
