import {ColourPicker} from './colour-picker.jsx';
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
import { ImageUpload } from './image-upload.jsx';
import {ProductImages} from './product-images.jsx';
import {productImages} from '../src/product-images.js';
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
    ["sizes", "Sizes (comma separated: Small, Medium, Large)"],
    ["tag", "Product label (optional)"],
    ["isNewArrival", "Show in New arrivals", "checkbox"],
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
export function RecordEditor({ page, record, onClose, onSave, uploadsEnabled }) {
  const [categories,setCategories] = useState([]);
  useEffect(()=>{if(page === "products") api("/admin/categories").then(r=>{setCategories(r.items.map(c=>c.name));if(!record)setValues(v=>({...v,category:r.items[0]?.name||""}));}).catch(()=>{});},[page]);
  const kind = contentKinds[page];
  const resource = kind ? "content" : page;
  const simpleContent = page === 'banners' || page === 'family';
  const editorFields = page === 'banners' ? [['status','Status',['draft','published']]] : page === 'family' ? [['title','Name'],['body','Caption (optional)','textarea'],['status','Visibility',['draft','published']]] : fields[resource];
  const [imageBusy,setImageBusy] = useState(false);
  const uploadPending = useRef(false);
  const initial = {
    ...(page === "products"
      ? {
          price: 0,
          sku: "RANG-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
          old: 0,
          stock: 0,
          color: "#FAF9F6",
          category: "",
          sizes: [],
          status: "draft",
        }
      : {}),
    ...(kind ? { kind, status: page === 'banners' ? 'published' : 'draft', sortOrder: 0, slug: kind + "-" + crypto.randomUUID() } : {}),
    ...(page === "reviews" ? { rating: 5, status: "draft" } : {}),
    ...(page === "coupons"
      ? { active: true, type: "percentage", minimum: 0 }
      : {}),
    ...record,
    ...(page === "products" ? {isNewArrival:record?.isNewArrival ?? (record?.tag === "NEW ARRIVAL")} : {}),
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
    if (uploadPending.current || busy) return;
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
                .map((s) => s.trim())
                .filter(Boolean);
        body[key] = value;
      }
      if (kind) body.kind = kind;
      if(simpleContent){body.slug=values.slug;body.alt=values.title;}
      if(page === 'banners' && body.status === 'published' && !values.imageUrl) throw new Error('Choose a banner image before publishing.');
      if (page === 'banners') Object.assign(body,{title:values.title || 'Homepage banner',alt:'RAJO Threads collection banner',link:'',body:'',layout:'full',mobileImageUrl:'',secondaryImageUrl:'',eyebrow:'',buttonText:''});
      if (["products", "content"].includes(resource))
        body.imageUrl = values.imageUrl || "";
      if(resource === 'products') body.imageUrls=productImages(values);
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
        if (!busy && !uploadPending.current) onClose();
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
          onClick={() => { if (!busy && !uploadPending.current) onClose(); }}
        >
          <X />
        </button>
      </div>
      {page === "products" && <p className="studio-note editor-help">Add your product details below. Choose Active to show it in the store, or Draft to save it for later. Enter Small, Medium or any sizes available for this product. Leave sizes empty for a free-size product; Kurta sets require at least one size.</p>}
      {page === 'banners' && <p className="studio-note editor-help">Upload your image and save as Published to show it on the homepage. Draft keeps it hidden. Only your image appears on the banner.</p>}
      {page === "reviews" && (
        <p className="studio-note">
          Admin-created reviews are always labelled “Demo review” and excluded
          from the customer rating average.
        </p>
      )}
      <form className="commerce-form studio-editor" onSubmit={save}>
        {page === 'settings' && <div className="span-all"><p>Shipping mode: free charges no shipping fee; paid charges the fee on every order; threshold offers free shipping when the product subtotal reaches the threshold. COD charge is added separately. Turning COD off pauses checkout because online payments are not configured.</p><p>To choose your fee, check your courier's charge for the packed parcel weight and destination, then add packaging costs. Example only: INR 70 courier + INR 10 packaging = INR 80 shipping. Set any extra COD collection charge separately. These are fixed store rules, not live courier quotes.</p></div>}
        {page === 'banners' && <p className="span-all">Upload your banner, add a title and choose when to show it. The page link is optional.</p>}
        {resource === 'products' && <div className="span-all"><ProductImages value={productImages(values)} onChange={urls=>setValues(current=>({...current,imageUrls:urls,imageUrl:urls[0]||''}))} enabled={uploadsEnabled&&!busy} onBusyChange={value=>{uploadPending.current=value;setImageBusy(value);}}/></div>}
        {resource === 'content' && <div className="span-all"><ImageUpload value={values.imageUrl} onChange={url=>setValues(current=>({...current,imageUrl:url}))} enabled={uploadsEnabled && !busy} banner={page === 'banners'} onBusyChange={value=>{uploadPending.current=value;setImageBusy(value);}} /></div>}
        {editorFields.map(([key, label, type]) => type === "color" ? <ColourPicker key={key} value={values[key]} onChange={value=>setValues(current=>({...current,[key]:value}))}/> : (
          <label key={key} className={type === "textarea" ? "span-all" : ""}>
            {label}
            {Array.isArray(type) ? (
              <select
                aria-label={label}
                required={key === "category"}
                value={key === "category" ? values[key] || "" : values[key] || type[0]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
              >
                {key === "category" && <option value="">Select category</option>}
                {(key === "category" ? [...new Set([...categories,values.category].filter(Boolean))] : type).map((o) => (
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
        {error && (
          <p role="alert" className="commerce-error span-all">
            {error}
          </p>
        )}
        <div className="studio-editor-actions span-all">
          <button
            type="button"
            className="secondary"
            onClick={() => { if (!busy && !uploadPending.current) onClose(); }}
            disabled={busy || imageBusy}
          >
            Cancel
          </button>
          <button className="primary" disabled={busy || imageBusy}>
            {busy ? "Saving…" : page === 'banners' ? values.status === 'published' ? 'Save & publish banner' : 'Save draft banner' : "Save changes"}
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
