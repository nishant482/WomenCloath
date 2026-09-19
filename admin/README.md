# Rang Studio — static admin dashboard

Run `npm install` (or `npm ci`) and `npm run dev` from the WomenCloath root, then open **http://localhost:5173/admin/**.

Demo login: **cloath@gmail.com** / **cloath**.

## Pages

Overview, products, collections, inventory, orders, returns & refunds, customers, discounts, campaigns, reviews, content, analytics, payments, shipping, and settings. Each page has its own URL, such as `/admin/#products` and `/admin/#orders`.

## Working demo interactions

- Add/edit products with image-library selection, SKU, collection, price, stock, sizes, description and status.
- Search, filter, sort, paginate, export products and bulk archive selected products.
- Add/edit collections, customers, discounts, campaigns, content and shipping methods.
- Adjust inventory; view orders and customer order history; update order/payment and return statuses.
- Moderate reviews, filter revenue charts, export CSV reports and save store preferences.
- Global search, notification links, mobile navigation, password visibility and sign-out.
- Reset the sample data through **Studio help → Reset demo data**.

Edits persist in localStorage under `rang-admin-demo-v1`; the demo login session uses sessionStorage. Demo credentials are intentionally public and this is **not production authentication**. There is no backend. The storefront catalog remains separate. Emails, payments, refunds, shipments and campaigns are not executed. Analytics are calculated from the demo records and use a fixed September 2026 snapshot.

The existing product images are reused from `public/images`. All admin UI code is in this directory. The root `vite.config.js` builds both the storefront and admin entry points. `npm run build` produces `dist/index.html` and `dist/admin/index.html`; `npm run preview` serves both.
