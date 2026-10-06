import { currentPath, goTo, followStoreLink } from "./navigation.js";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  Heart,
  ShoppingBag,
  ArrowUpRight,
  ArrowRight,
  X,
  Plus,
  Minus,
  Menu,
  Check,
  SlidersHorizontal,
  Flower2,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { BackToTop, WhatsAppButton } from "./storefront-polish.jsx";
import { BrandLogo } from "./brand-story.jsx";
import { InnerPage, PageBanner } from "./pages.jsx";
import { SiteFooter } from "./home-extras.jsx";
import {
  ProductFilters,
  emptyFilters,
  matchesFilters,
} from "./product-filters.jsx";
import { StoreProvider, useStore } from "./store-context.jsx";
import { productImage } from "./api.js";
import { AccountPage, CheckoutPage } from "./account.jsx";
import { BlogPage } from "./cms.jsx";
import "./commerce.css";
import "./styles.css";
import "./pages.css";
import "./brand-refresh.css";
import "./storefront-polish.css";
import "./atelier.css";
import "./boutique.css";
import "./signature.css";
import "./fashion-store.css";
import "./whatsapp.css";
import "./retail-refresh.css";
import { ProductCard } from "./product-card.jsx";
import { FashionHome } from "./fashion-home.jsx";
import "./brand-palette.css";
import "./inner-pages.css";

import {categorySlug} from "./catalogue-options.js";
const money = (n) => `₹${n.toLocaleString("en-IN")}`;
const categoryPath = (c) =>
  "/collections/" +
  ({
    "All styles": "all",
    "Kurta sets": "kurta-sets",
    "New arrivals": "new-arrivals",
  }[c] || categorySlug(c));
const routeCategory = (route,categories) =>
  ({
    all: "All styles",
    sarees: "Sarees",
    lehengas: "Lehengas",
    "kurta-sets": "Kurta sets",
    "new-arrivals": "New arrivals",
  })[route.split("/")[2]] || categories.find(c=>c.slug===route.split("/")[2])?.name || "Unknown collection";

function App() {
  const store = useStore();
  const { products, bag, wish, setBag, setWish, user } = store;
  const [route, setRoute] = useState(currentPath);
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [sort, setSort] = useState("Featured");
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const isHome = route === "/";
  const isCollection = route.startsWith("/collections/");
  const category = isCollection ? routeCategory(route,store.categories || []) : "All styles";
  const navigate = (path) => {
    setMenu(false);
    setPanel(null);
    if (location.pathname === path)
      window.scrollTo({ top: 0, behavior: "instant" });
    else goTo(path);
  };
  const shop = (c = "All styles") => {
    setFilters({ ...emptyFilters });
    setSearch("");
    navigate(categoryPath(c));
  };
  const notify = (message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  };
  const toggleWish = (id) => {
    if (!user) {
      navigate("/account");
      notify("Sign in to save your favourites.");
      return;
    }
    return setWish((w) =>
      w.includes(id) ? w.filter((x) => x !== id) : [...w, id],
    ).catch((e) => notify(e.message));
  };
  const add = async (p) => {
    if (p.stock < 1) {
      notify("This style is currently out of stock.");
      return;
    }
    if (p.sizes?.length > 0 && !p.size) {
      navigate("/product/" + p.id);
      notify("Choose your size to add this set");
      return;
    }
    const key = p.id + "-" + (p.size || "free");
    try {
      await setBag((items) =>
        items.some((x) => x.key === key)
          ? items.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x))
          : [...items, { ...p, key, qty: 1 }],
      );
      notify("A lovely choice. Added to your bag.");
    } catch (e) {
      notify(e.message);
    }
  };
  const quantity = (key, change) =>
    setBag((items) =>
      items
        .map((x) => (x.key === key ? { ...x, qty: x.qty + change } : x))
        .filter((x) => x.qty > 0),
    ).catch((e) => notify(e.message));
  const clearAllFilters = () => {
    setFilters({ ...emptyFilters });
    setSearch("");
    if (isCollection) navigate("/collections/all");
  };
  useEffect(() => {
    const change = () => {
      setRoute(currentPath());
      setMenu(false);
      setPanel(null);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", change);
    window.addEventListener("hashchange", change);
    document.addEventListener("click", followStoreLink);
    return () => {
      window.removeEventListener("popstate", change);
      window.removeEventListener("hashchange", change);
      document.removeEventListener("click", followStoreLink);
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    const title = isHome
      ? "Shop Sarees, Lehengas & Kurta Sets for Women"
      : isCollection
        ? routeCategory(route,store.categories || [])
        : route.startsWith("/product/")
          ? products.find((p) => p.id === Number(route.split("/")[2]))?.name ||
            "Product"
          : route.slice(1).replaceAll("-", " ");
    document.title = title + " | RAJO Threads";
    let canonical=document.querySelector('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}
    canonical.href='https://rajothreads.com'+route;
  }, [route, products, store.categories]);
  useEffect(() => {
    if (!panel && !menu) return;
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector(
      panel ? ".drawer" : "#primary-navigation",
    );
    if (panel) dialog?.querySelector("button")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPanel(null);
        setMenu(false);
      }
      if (e.key === "Tab") {
        const items = [
          ...(panel
            ? dialog
            : document.querySelector("header")
          ).querySelectorAll("button, input, select, a[href]"),
        ].filter((el) => el.getClientRects().length);
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus({ preventScroll: true });
    };
  }, [panel, menu]);
  useEffect(() => {
    const wide = matchMedia("(min-width: 1101px)");
    const close = () => {
      if (wide.matches) setMenu(false);
    };
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);
  if (store.error)
    return (
      <main className="commerce-status">
        <h1>We’ll be right with you.</h1>
        <p role="alert">{store.error}</p>
        <button className="primary" onClick={store.refresh}>
          Try again
        </button>
      </main>
    );
  let visible = products.filter(
    (p) =>
      (category === "All styles" ||
        category === "New arrivals" ||
        p.category === category) &&
      (category !== "New arrivals" || p.tag === "NEW ARRIVAL") &&
      (isHome ||
        (`${p.name} ${p.fabric} ${p.category}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
          matchesFilters(p, filters))),
  );
  if (isCollection && sort === "Price: low to high")
    visible.sort((a, b) => a.price - b.price);
  if (isCollection && sort === "Price: high to low")
    visible.sort((a, b) => b.price - a.price);
  const bagCount = bag.reduce((sum, p) => sum + p.qty, 0);
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <div className="announcement">
        <span>INDIAN ROOTS. A BEAUTIFULLY MODERN SOUL.</span>
        <a href="/about">
          A little tradition. A lot of heart. <ArrowUpRight size={13} />
        </a>
      </div>
      <header className="store-header">
        <button
          className="mobile-menu icon-button"
          aria-label={menu ? "Close navigation" : "Open navigation"}
          aria-expanded={menu}
          aria-controls="primary-navigation"
          onClick={() => {
            setMenu(!menu);
            setSearchOpen(false);
          }}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <div className="header-assistance">
          <span className="header-currency">INR ₹</span>
          <a href="/contact">
            <MessageCircle size={16} /> Contact us
          </a>
          <a href="/about">Our story</a>
        </div>
        <div className="store-brand">
          <BrandLogo />
          <span aria-hidden="true">
            RAJO<small>THREADS</small>
          </span>
        </div>
        <nav
          id="primary-navigation"
          aria-label="Main navigation"
          className={menu ? "open" : ""}
          onClick={(e) => {
            if (e.target.closest("a")) {
              setMenu(false);
              setSearch("");
              setFilters({ ...emptyFilters });
            }
          }}
        >
          {[
            ["Home", "/"],
            ["New arrivals", "/collections/new-arrivals"],
            ["Shop all", "/collections/all"],
            ["Sarees", "/collections/sarees"],
            ["Lehengas", "/collections/lehengas"],
            ["Kurta sets", "/collections/kurta-sets"],
            ["Our story", "/about"],
            ["Customer stories", "/rajo-family"],
          ].map(([label, path]) => (
            <a
              key={path}
              href={path}
              aria-current={route === path ? "page" : undefined}
            >
              {label}
            </a>
          ))}
          <div className="menu-signoff">
            <Flower2 />
            <p>
              For every woman.
              <br />
              <em>Every beautiful moment.</em>
            </p>
            <a href="/contact">
              Need a little guidance? <ArrowUpRight size={16} />
            </a>
          </div>
        </nav>
        <div className="header-actions">
          <form
            className="header-product-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(
                new FormData(e.currentTarget).get("q").toString().trim(),
              );
              setFilters({ ...emptyFilters });
              navigate("/collections/all");
            }}
          >
            <input
              name="q"
              aria-label="Search styles"
              placeholder="Search sarees, kurta sets…"
            />
            <button aria-label="Submit product search">
              <Search size={17} />
            </button>
          </form>
          <a
            className="icon-button"
            href="/account"
            aria-label={user ? "Your account" : "Sign in or create account"}
          >
            <UserRound />
          </a>
          <button
            aria-label="Search products"
            aria-expanded={searchOpen}
            className="icon-button"
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMenu(false);
            }}
          >
            <Search />
          </button>
          <button
            aria-label="Open wishlist"
            className="icon-button"
            onClick={() => {
              if (!user) {
                navigate("/account");
                notify("Sign in to see your wishlist.");
                return;
              }
              setPanel("wishlist");
              setMenu(false);
            }}
          >
            <Heart />
            {wish.length > 0 && <b>{wish.length}</b>}
          </button>
          <button
            aria-label="Open shopping bag"
            className="icon-button"
            onClick={() => {
              setPanel("bag");
              setMenu(false);
            }}
          >
            <ShoppingBag />
            {bagCount > 0 && <b>{bagCount}</b>}
          </button>
        </div>
      </header>
      {menu && (
        <button
          className="menu-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      {searchOpen && (
        <form
          className="search-bar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters({ ...emptyFilters });
            navigate("/collections/all");
            setSearchOpen(false);
          }}
        >
          <Search size={20} />
          <label className="sr-only" htmlFor="product-search">
            Search the collection
          </label>
          <input
            id="product-search"
            autoFocus
            placeholder="Try ‘silk’, ‘pink’ or ‘kurta’"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="search-submit">
            Search <ArrowRight size={17} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Close search"
            onClick={() => {
              setSearchOpen(false);
              setSearch("");
            }}
          >
            <X />
          </button>
        </form>
      )}
      <main
        id="main-content"
        className={isHome ? "" : "storefront-inner"}
        aria-busy={store.loading}
        tabIndex={-1}
      >
        {isHome && (
          <FashionHome
            products={products}
            wish={wish}
            toggleWish={toggleWish}
            add={add}
            onSearch={(value) => {
              setSearch(value);
              setFilters({ ...emptyFilters });
              navigate("/collections/all");
            }}
          />
        )}
        {isCollection && (
          <PageBanner
            eyebrow="FIND A LITTLE MORE YOU"
            image={
              category === "Lehengas"
                ? "https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/14b7f90d-57b4-4eb1-ad32-29392da2be19.jpg"
                : category === "Kurta sets"
                  ? "https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/4e440f9a-207b-4460-bef6-71ea20cc7814.jpg"
                  : category === "New arrivals"
                    ? "https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/ac00204e-234e-464f-b7b3-507e63e714ec.jpg"
                    : "https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/891a7c10-6620-4c62-be2b-01b77e7b3f81.jpg"
            }
            title={
              category === "All styles"
                ? "The RAJO wardrobe."
                : category === "New arrivals"
                  ? "Fresh threads. New stories."
                  : category + ", with love."
            }
            text="Beautiful colours. Thoughtful details. Pieces for your everyday and your extraordinary."
          />
        )}
        {!store.loading && isCollection && (
          <section className="collection" id="collection">
            <div className="section-heading">
              <div>
                <div className="eyebrow">MAKE IT YOUR OWN</div>
                <h2>
                  Find your <em>kind of beautiful.</em>
                </h2>
              </div>
            </div>
            <div className="filter-bar">
              <div className="tabs" aria-label="Product categories">
                {[
                  "All styles",
                  ...(store.categories?.length ? store.categories.map(c=>c.name) : ["Sarees","Lehengas","Kurta sets"]),
                  "New arrivals",
                ].map((c) => (
                  <button
                    key={c}
                    aria-pressed={category === c}
                    className={category === c ? "active" : ""}
                    onClick={() => navigate(categoryPath(c))}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <label className="sort">
                <SlidersHorizontal size={16} />
                <select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option>Featured</option>
                  <option>Price: low to high</option>
                  <option>Price: high to low</option>
                </select>
              </label>
            </div>
            <ProductFilters
              products={products}
              filters={filters}
              setFilters={setFilters}
              count={visible.length}
              category={category}
              search={search}
              clearAll={clearAllFilters}
              clearCategory={() => navigate("/collections/all")}
              clearSearch={() => setSearch("")}
            />

            <div className="product-grid">
              {visible.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wish={wish}
                  toggleWish={toggleWish}
                  add={add}
                />
              ))}
            </div>
            {visible.length === 0 && (
              <div className="empty">
                <Search size={32} />
                <h3>No matches, just yet.</h3>
                <p>
                  Try another colour or fabric. Your next favourite is here
                  somewhere.
                </p>
                <button className="primary" onClick={clearAllFilters}>
                  Explore all styles
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </section>
        )}
        {store.loading && !isHome && (
          <p className="page-width" role="status">
            Loading page…
          </p>
        )}
        {!store.loading && route === "/account" && <AccountPage />}
        {!store.loading && route === "/checkout" && <CheckoutPage />}
        {!store.loading && route.startsWith("/blog") && (
          <BlogPage slug={route.split("/")[2]} />
        )}
        {!store.loading &&
          !isHome &&
          !isCollection &&
          !["/account", "/checkout"].includes(route) &&
          !route.startsWith("/blog") && (
            <InnerPage
              route={route}
              products={products}
              add={add}
              wish={wish}
              toggleWish={toggleWish}
              shop={shop}
              openProduct={(p) => navigate("/product/" + p.id)}
            />
          )}
        <section className="community-invitation">
          <Flower2 size={48} strokeWidth={1} />
          <div>
            <div className="eyebrow">THERE’S ALWAYS ROOM FOR YOU</div>
            <h2>
              A little closer. <em>A little more RAJO.</em>
            </h2>
            <p>
              New finds, everyday inspiration, and a shared love for all things
              beautiful.
            </p>
          </div>
          <a
            className="primary"
            href="https://www.instagram.com/rajo_threads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meet us on Instagram <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
      {!panel && !menu && <WhatsAppButton />}
      {toast && (
        <div className="toast" role="status">
          <Check size={19} />
          {toast}
        </div>
      )}
      {panel && (
        <div className="overlay" onClick={() => setPanel(null)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={
              panel === "bag" ? "Your shopping bag" : "Your favourites"
            }
            className="drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <div className="eyebrow">A LITTLE SOMETHING FOR YOU</div>
                <h2>
                  {panel === "bag" ? "Your shopping bag." : "Your favourites."}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close panel"
                onClick={() => setPanel(null)}
              >
                <X />
              </button>
            </div>
            {(panel === "bag" ? bag.length === 0 : wish.length === 0) ? (
              <div className="drawer-empty">
                {panel === "bag" ? (
                  <ShoppingBag size={44} strokeWidth={1} />
                ) : (
                  <Heart size={44} strokeWidth={1} />
                )}
                <h3>
                  {panel === "bag"
                    ? "A little colour belongs here."
                    : "Keep a little love for later."}
                </h3>
                <p>
                  {panel === "bag"
                    ? "Find something that feels like you."
                    : "Tap the heart on a piece you love. We’ll keep it here for you."}
                </p>
                <button className="primary" onClick={() => shop()}>
                  Discover the collection <ArrowUpRight size={18} />
                </button>
              </div>
            ) : (
              <>
                {(panel === "bag"
                  ? bag
                  : products.filter((p) => wish.includes(p.id))
                ).map((p) => (
                  <div className="bag-item" key={p.key || p.id}>
                    <a href={"/product/" + p.id} onClick={() => setPanel(null)}>
                      <img src={productImage(p)} alt={p.name} />
                    </a>
                    <div>
                      <span className="eyebrow">{p.category}</span>
                      <a
                        href={"/product/" + p.id}
                        onClick={() => setPanel(null)}
                      >
                        <h3>{p.name}</h3>
                      </a>
                      <p>
                        {money(p.price)}
                        {p.size && <small> · Size {p.size}</small>}
                      </p>
                      {panel === "bag" ? (
                        <div className="quantity">
                          <button
                            aria-label={`Decrease quantity of ${p.name}`}
                            onClick={() => quantity(p.key, -1)}
                          >
                            <Minus size={15} />
                          </button>
                          <span>{p.qty}</span>
                          <button
                            aria-label={`Increase quantity of ${p.name}`}
                            onClick={() => quantity(p.key, 1)}
                          >
                            <Plus size={15} />
                          </button>
                          <button
                            className="remove"
                            onClick={() =>
                              setBag((items) =>
                                items.filter((x) => x.key !== p.key),
                              ).catch((e) => notify(e.message))
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="wishlist-actions">
                          <button className="text-link" onClick={() => add(p)}>
                            {p.sizes?.length > 0
                              ? "Choose size"
                              : "Add to bag"}{" "}
                            <Plus size={15} />
                          </button>
                          <button
                            className="remove"
                            onClick={() => toggleWish(p.id)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {panel === "bag" && (
                  <div className="total">
                    <h3>
                      Subtotal{" "}
                      <span>
                        {money(
                          bag.reduce((sum, p) => sum + p.price * p.qty, 0),
                        )}
                      </span>
                    </h3>
                    <p>
                      {user
                        ? "Your bag is saved to your account."
                        : "Checkout as a guest — no account needed."}
                    </p>
                    <a
                      className="primary checkout-button"
                      href="/checkout"
                      onClick={() => setPanel(null)}
                    >
                      Proceed to checkout <ArrowRight size={17} />
                    </a>
                    <a
                      className="secondary"
                      href="/contact"
                      onClick={() => setPanel(null)}
                    >
                      Ask about a piece <MessageCircle size={17} />
                    </a>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StoreProvider>
    <App />
  </StoreProvider>,
);
