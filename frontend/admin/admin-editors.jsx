import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Star,
  Image,
  FileText,
  TicketPercent,
  Settings,
  Mail,
  LogOut,
  Plus,
  Menu,
  X,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { api, productImage } from "../src/api.js";
import { MediaLibrary } from './media-library.jsx';
const navigation = [
  ["overview", "Overview", LayoutDashboard],
  ["products", "Products & inventory", Package],
  ["orders", "Orders & returns", ShoppingBag],
  ["users", "Users", Users],
  ["reviews", "Reviews", Star],
  ["banners", "Banners", Image],
  ["family", "RAJO family", Image],
  ["blogs", "Blog posts", FileText],
  ["coupons", "Discount codes", TicketPercent],
  ["enquiries", "Customer enquiries", Mail],
  ["settings", "Store & shipping", Settings],
];
const contentKinds = { banners: "banner", family: "family", blogs: "blog" };
const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fields = {
  products: [
    ["name", "Product name"],
    ["sku", "SKU"],
    ["category", "Category", ["Sarees", "Lehengas", "Kurta sets"]],
    ["fabric", "Fabric & finish"],
    ["price", "Selling price (₹)", "number"],
    ["old", "Original price (₹, 0 for none)", "number"],
    ["stock", "Available units", "number"],
    ["colour", "Colour name"],
    ["color", "Swatch colour", "color"],
    ["sizes", "Sizes (comma separated: S,M,L,XL,XXL)"],
    ["tag", "Product label (optional)"],
    ["description", "Description", "textarea"],
    ["status", "Status", ["draft", "active", "archived"]],
  ],
  content: [
    ["title", "Title"],
    ["slug", "URL slug (lowercase, hyphens)"],
    ["body", "Text / article content", "textarea"],
    ["alt", "Image description"],
    ["link", "Store link (optional, e.g. /collections/all)"],
    ["sortOrder", "Display order", "number"],
    ["status", "Status", ["draft", "published"]],
  ],
  coupons: [
    ["code", "Discount code"],
    ["type", "Discount type", ["percentage", "fixed"]],
    ["value", "Discount amount", "number"],
    ["minimum", "Minimum order (₹)", "number"],
    ["expiresAt", "Expiry date", "date"],
    ["active", "Active", "checkbox"],
  ],
  reviews: [
    ["productId", "Product ID", "number"],
    ["rating", "Rating (1–5)", "number"],
    ["title", "Review title"],
    ["body", "Review text", "textarea"],
    ["status", "Status", ["draft", "published"]],
  ],
  settings: [
    ["storeName", "Store name"],
    ["contactEmail", "Contact email", "email"],
    ["shippingFee", "Shipping fee (₹)", "number"],
    ["freeShippingAbove", "Free shipping threshold (₹)", "number"],
    ["shippingMode", "Shipping mode", ["free", "paid", "threshold"]],
    ["codFee", "Extra COD charge (INR)", "number"],
    ["codEnabled", "Enable cash-on-delivery orders", "checkbox"],
    ["shippingPolicy", "Shipping policy", "textarea"],
    ["returnPolicy", "Return policy", "textarea"],
  ],
};
function ImageInput({ value, onChange, enabled }) {
  const [library, setLibrary] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="studio-image-field">
      <button type="button" className="secondary" onClick={() => setLibrary(!library)}>{library ? 'Close image library' : 'Choose from image library'}</button>
      {library && <MediaLibrary onSelect={url => { onChange(url); setLibrary(false); }} />}
      <label>
        Image URL (optional)
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/de847675-bab8-49d1-ba7e-38df2ac1fd04.jpg"
        />
      </label>
      <label>
        Upload image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={!enabled || busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 3 * 1024 * 1024) {
              setError("Choose an image smaller than 3 MB.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/api/admin/uploads", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                  "Content-Type": file.type,
                  "X-Requested-With": "RajoStore",
                },
                body: file,
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error);
              onChange(data.url);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <small>
        {busy
          ? "Uploading…"
          : enabled
            ? "JPEG, PNG or WebP · up to 3 MB"
            : "Image uploads are not connected yet. You can paste an image URL above."}
      </small>
      {value && (
        <img
          src={value}
          alt="Selected image preview"
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder.svg";
          }}
        />
      )}
      {error && <p className="commerce-error">{error}</p>}
    </div>
  );
}
export function RecordEditor({ page, record, onClose, onSave, uploadsEnabled }) {
  const kind = contentKinds[page];
  const resource = kind ? "content" : page;
  const initial = {
    ...(page === "products"
      ? {
          price: 0,
          sku: "RANG-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
          old: 0,
          stock: 0,
          color: "#173b69",
          category: "Sarees",
          sizes: [],
          status: "draft",
        }
      : {}),
    ...(kind ? { kind, status: "draft", sortOrder: 0 } : {}),
    ...(page === "reviews" ? { rating: 5, status: "draft" } : {}),
    ...(page === "coupons"
      ? { active: true, type: "percentage", minimum: 0 }
      : {}),
    ...record,
  };
  const [values, setValues] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {};
      for (const [key, , type] of fields[resource]) {
        let value = values[key] ?? "";
        if (type === "number") value = Number(value);
        if (type === "checkbox") value = Boolean(value);
        if (type === "date")
          value = new Date(value + "T23:59:59Z").toISOString();
        if (key === "sizes")
          value = Array.isArray(value)
            ? value
            : String(value)
                .split(",")
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean);
        body[key] = value;
      }
      if (kind) body.kind = kind;
      if (page === 'banners') for (const key of ['mobileImageUrl','secondaryImageUrl','eyebrow','buttonText','layout']) body[key] = values[key] || ({ eyebrow:'THE RAJO EDIT',buttonText:'Shop now',layout:'full' }[key] || '');
      if (["products", "content"].includes(resource))
        body.imageUrl = values.imageUrl || "";
      const id =
        resource === "settings"
          ? undefined
          : resource === "products"
            ? record?.id
            : record?._id;
      await api("/admin/" + resource + (id ? "/" + id : ""), {
        method: resource === "settings" || id ? "PUT" : "POST",
        body,
      });
      await onSave();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <dialog
      className="studio-dialog"
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="studio-dialog-heading">
        <h2>
          {record ? "Edit" : "Add"}{" "}
          {page === "products" ? "product" : navigation.find((n) => n[0] === page)?.[1] || page}
        </h2>
        <button
          className="icon-button"
          aria-label="Close editor"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {page === "products" && <p className="studio-note editor-help">Add your product details below. Choose Active to show it in the store, or Draft to save it for later. Kurta sets need at least one size.</p>}
      {page === "reviews" && (
        <p className="studio-note">
          Admin-created reviews are always labelled “Demo review” and excluded
          from the customer rating average.
        </p>
      )}
      <form className="commerce-form studio-editor" onSubmit={save}>
        {page === 'settings' && <p className="span-all">Shipping mode: free charges no shipping fee; paid charges the fee on every order; threshold offers free shipping when the product subtotal reaches the threshold. COD charge is added separately. Turning COD off pauses checkout because online payments are not configured.</p>}
        {page === 'banners' && <div className="span-all"><p>Published banners appear in the homepage slider. Lower display order appears first. Draft hides a slide.</p><label>Small heading<input value={values.eyebrow || ''} onChange={e => setValues({...values,eyebrow:e.target.value})} maxLength={80} /></label><label>Button text<input value={values.buttonText || ''} onChange={e => setValues({...values,buttonText:e.target.value})} maxLength={60} /></label><label>Banner layout<select value={values.layout || 'full'} onChange={e => setValues({...values,layout:e.target.value})}><option value="full">Single image</option><option value="split">Two images with centre text</option></select></label><h3>Mobile image (optional)</h3><ImageInput value={values.mobileImageUrl} onChange={url => setValues({...values,mobileImageUrl:url})} enabled={uploadsEnabled} />{values.layout === 'split' && <><h3>Second desktop image</h3><ImageInput value={values.secondaryImageUrl} onChange={url => setValues({...values,secondaryImageUrl:url})} enabled={uploadsEnabled} /></>}</div>}
        {fields[resource].map(([key, label, type]) => (
          <label key={key} className={type === "textarea" ? "span-all" : ""}>
            {label}
            {Array.isArray(type) ? (
              <select
                aria-label={label}
                value={values[key] || type[0]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
              >
                {type.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : type === "textarea" ? (
              <textarea
                aria-label={label}
                value={values[key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
                rows={6}
              />
            ) : type === "checkbox" ? (
              <input
                aria-label={label}
                type="checkbox"
                checked={Boolean(values[key])}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.checked })
                }
              />
            ) : (
              <input
                aria-label={label}
                type={type || "text"}
                value={
                  type === "date"
                    ? String(values[key] || "").slice(0, 10)
                    : Array.isArray(values[key])
                      ? values[key].join(",")
                      : (values[key] ?? "")
                }
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
                min={type === "number" ? (["price", "rating", "productId"].includes(key) ? 1 : 0) : undefined}
                minLength={key === "name" ? 3 : ["sku", "fabric"].includes(key) ? 2 : undefined}
                placeholder={key === "name" ? "e.g. Rose Pink Cotton Saree" : key === "fabric" ? "e.g. Cotton · Hand embroidered" : key === "sizes" ? "S, M, L, XL, XXL" : undefined}
                step={
                  [
                    "price",
                    "old",
                    "value",
                    "minimum",
                    "shippingFee",
                    "codFee",
                    "freeShippingAbove",
                  ].includes(key)
                    ? ".01"
                    : "1"
                }
                required={
                  ![
                    "description",
                    "body",
                    "alt",
                    "link",
                    "colour",
                    "tag",
                    "sizes",
                    "contactEmail",
                  ].includes(key)
                }
              />
            )}
          </label>
        ))}
        {["products", "content"].includes(resource) && (
          <div className="span-all">
            <ImageInput
              value={values.imageUrl}
              onChange={(url) => setValues({ ...values, imageUrl: url })}
              enabled={uploadsEnabled}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="commerce-error span-all">
            {error}
          </p>
        )}
        <div className="studio-editor-actions span-all">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function OrderDetails({ order, onUpdate, busy }) {
  return (
    <details open>
      <summary>Details & actions</summary>
      <div className="studio-order">
        <p>
          {order.email} · {order.address?.phone}
        </p>
        <p>
          {order.address?.name}, {order.address?.line1} {order.address?.line2},{" "}
          {order.address?.city}, {order.address?.state} {order.address?.postalCode}
        </p>
        {(order.items || []).map((p, i) => (
          <div className="order-item" key={i}>
            <img src={productImage(p)} alt={p.name} />
            <div>
              {p.name}
              <p>
                {p.size && `Size ${p.size} · `}Qty {p.qty} ·{" "}
                {money(p.unitPrice)}
              </p>
            </div>
          </div>
        ))}
        <p>
          Subtotal {money(order.subtotal)} · Discount {money(order.discount)} ·
          Shipping {money(order.shipping)} · COD {money(order.codFee || 0)} · Total {money(order.total)}
        </p>
        <form
          className="commerce-form"
          onSubmit={(e) => {
            e.preventDefault();
            const body = Object.fromEntries(new FormData(e.currentTarget));
            Object.keys(body).forEach((k) => {
              if (body[k] === "") delete body[k];
            });
            onUpdate(order._id, body);
          }}
        >
          <label>
            Order status
            <select name="status" defaultValue={order.status}>
              {[
                "placed",
                "confirmed",
                "packed",
                "shipped",
                "delivered",
                "cancelled",
                "returned",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Courier
            <input name="courier" defaultValue={order.courier || ""} />
          </label>
          <label>
            Tracking number
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber || ""}
            />
          </label>
          <label>
            Record payment / refund
            <select name="paymentStatus" defaultValue="">
              <option value="">Keep {order.paymentStatus}</option>
              <option value="paid">COD payment collected</option>
              <option value="refunded">Refund issued externally</option>
            </select>
          </label>
          {order.returnRequest && (
            <>
              <p>
                Return: {order.returnRequest.reason} ·{" "}
                {order.returnRequest.status}
              </p>
              <label>
                Return request
                <select name="returnStatus" defaultValue="">
                  <option value="">Keep current status</option>
                  <option>approved</option>
                  <option>rejected</option>
                  <option>received</option>
                </select>
              </label>
            </>
          )}
          <small>
            Payments, refunds and courier bookings must be completed externally;
            these controls record their status.
          </small>
          <button className="primary" disabled={busy}>
            Update order
          </button>
        </form>
        <ol>
          {order.history?.map((h, i) => (
            <li key={i}>
              {h.status} · {new Date(h.at).toLocaleString("en-IN")}
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
