import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "./api.js";
const Context = createContext(null);
export const useStore = () => useContext(Context);
const read = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
export function StoreProvider({ children }) {
  const [categories,setCategories] = useState([]);
  const [products, setProducts] = useState([]),
    [content, setContent] = useState([]),
    [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [settings, setSettings] = useState({});
  const [cart, setCart] = useState(() =>
    read("rajo-bag")
      .map((p) => ({
        productId: p.productId || p.id,
        size: p.size || "",
        qty: p.qty,
      }))
      .filter((p) => Number.isInteger(p.productId) && p.qty > 0 && p.qty <= 20),
  );
  const [wish, setWishState] = useState([]);
  const cartRef = useRef(cart),
    wishRef = useRef(wish),
    userRef = useRef(null),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);
  useEffect(() => {
    wishRef.current = wish;
  }, [wish]);
  const bag = cart.flatMap((line) => {
    const p = products.find((p) => p.id === line.productId);
    return p
      ? [
          {
            ...p,
            size: line.size || undefined,
            qty: line.qty,
            key: p.id + "-" + (line.size || "free"),
          },
        ]
      : [];
  });
  const refreshCatalog = async () => {
    const [catalog, contents, storeSettings] = await Promise.all([
      api("/products?limit=100"),
      api("/content"),
      api("/settings"),
    ]);
    let all = catalog.items;
    for (let page = 2; all.length < catalog.total; page++) {
      const more = await api("/products?limit=100&page=" + page);
      if (!more.items.length) break;
      all = all.concat(more.items);
    }
    setProducts(all);
    setCategories(catalog.categories || []);
    setContent(contents.items);
    setSettings(storeSettings);
    return all;
  };
  const restore = async () => {
    const result = await api("/cart");
    cartRef.current = result.items;
    wishRef.current = result.wishlist;
    setCart(result.items);
    setWishState(result.wishlist);
  };
  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([
        refreshCatalog(),
        (async () => {
          try {
            const result = await api("/auth/me");
            setUser(result.user);
            userRef.current = result.user;
            await restore();
          } catch (e) {
            if (e.status !== 401) throw e;
            if (userRef.current) {
              cartRef.current = [];
              setCart([]);
            }
            wishRef.current = [];
            setWishState([]);
            setUser(null);
            userRef.current = null;
          }
        })(),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);
  const onLogin = async (authenticated) => {
    const guestCart = cartRef.current;
    setUser(authenticated);
    userRef.current = authenticated;
    const server = await api("/cart");
    const merged = new Map(
      server.items.map((p) => [p.productId + "-" + p.size, p]),
    );
    for (const item of guestCart) {
      const p = products.find((p) => p.id === item.productId);
      if (!p || (p.sizes?.length > 0 && !p.sizes.includes(item.size)))
        continue;
      const key = item.productId + "-" + item.size;
      const old = merged.get(key);
      merged.set(key, {
        ...item,
        qty: Math.min(20, Math.max(old?.qty || 0, item.qty)),
      });
    }
    const result = await api("/cart", {
      method: "PUT",
      body: { items: [...merged.values()] },
    });
    const wishes = await api("/wishlist", {
      method: "PUT",
      body: { items: server.wishlist },
    });
    cartRef.current = result.items;
    wishRef.current = wishes.items;
    setCart(result.items);
    setWishState(wishes.items);
    write("rajo-bag", []);
    write("rajo-wishlist", []);
  };
  const logout = async () => {
    await queue.current;
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    userRef.current = null;
    cartRef.current = [];
    wishRef.current = [];
    setCart([]);
    setWishState([]);
    write("rajo-bag", []);
    write("rajo-wishlist", []);
  };
  const mutate = (action) => {
    const result = queue.current.then(action);
    queue.current = result.catch(() => {});
    return result;
  };
  const setBag = (updater) =>
    mutate(async () => {
      const current = cartRef.current.flatMap((line) => {
        const p = products.find((p) => p.id === line.productId);
        return p
          ? [
              {
                ...p,
                qty: line.qty,
                size: line.size || undefined,
                key: p.id + "-" + (line.size || "free"),
              },
            ]
          : [];
      });
      const next = typeof updater === "function" ? updater(current) : updater;
      const items = next.map((p) => ({
        productId: p.id,
        size: p.size || "",
        qty: Math.min(20, p.qty),
      }));
      if (userRef.current) {
        const result = await api("/cart", { method: "PUT", body: { items } });
        cartRef.current = result.items;
        setCart(result.items);
      } else {
        cartRef.current = items;
        setCart(items);
        write("rajo-bag", items);
      }
    });
  const setWish = (updater) =>
    mutate(async () => {
      if (!userRef.current)
        throw Object.assign(new Error("Sign in to save your favourites."), {
          status: 401,
        });
      let items =
        typeof updater === "function" ? updater(wishRef.current) : updater;
      if (userRef.current)
        items = (await api("/wishlist", { method: "PUT", body: { items } }))
          .items;
      wishRef.current = items;
      setWishState(items);
    });
  const refreshBag = async () => {
    await queue.current;
    if (userRef.current) await restore();
    await refreshCatalog();
  };
  return (
    <Context.Provider
      value={{
        products,
        categories,
        content,
        user,
        loading,
        error,
        settings,
        bag,
        wish,
        setBag,
        setWish,
        onLogin,
        logout,
        refresh,
        refreshBag,
        setUser,
      }}
    >
      {children}
    </Context.Provider>
  );
}
