# RAJO Threads

Responsive React storefront and admin studio with a Node.js/Express MVC API, MongoDB and JWT authentication. The original logo, terracotta product titles/prices, and borderless product cards are retained.

The homepage follows the supplied Meena Bazaar and Odhni references with a centred retail header, searchable catalog, manually controlled campaign carousel, category and occasion shopping, fresh arrivals and collection rows. RAJO's navy, ivory, terracotta and mustard colours are retained. Published admin banners replace the default hero campaigns. Collection rows use live products; colour shortcuts open filtered catalog results. Homepage composition lives in `frontend/src/fashion-home.jsx`, shared product cards in `frontend/src/product-card.jsx`, and the retail layout in `frontend/src/fashion-store.css`.

## Project structure

```text
frontend/
  src/                 Storefront, account, checkout, reviews and journal
  admin/               Connected store administration
  public/              Product, founder and family images
  vite.config.js       Two frontend entries and development API proxy
backend/
  src/
    config/            Environment and MongoDB connection
    models/            Native MongoDB collection models, schemas and indexes
    controllers/       Request handling for storefront and admin features
    routes/            Express route definitions
    middleware/        JWT authentication, roles, origin checks and errors
    services/          Passwords, verification codes, email and order transactions
    validators/        Shared request validation primitives
    app.js             Express assembly with injectable services for tests
    server.js          Node server entry
  scripts/             Seed and service checks
  tests/               Isolated API integration and browser tests
  .env.example         Server environment template
api/index.js           Thin Vercel adapter to backend/src/app.js
vercel.json            Combined deployment configuration
```

## Local setup

Use Node.js 22.17 or later. From the repository root, run `npm install`. Copy `backend/.env.example` to `backend/.env.local` and configure:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI`, `MONGODB_DB` | Atlas or a MongoDB replica set; transactions require a replica set |
| `APP_URL` | Exact frontend origin; locally `http://localhost:5173` |
| `JWT_SECRET` | Random secret, at least 32 characters; identical across API instances |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail address and valid Gmail App Password |
| `ADMIN_EMAIL` | Protected owner email; provision credentials with `backend/scripts/set-admin.mjs` |
| `REQUIRE_EMAIL_VERIFICATION` | Defaults to `false`: customer signup signs in immediately without sending email |
| `API_PORT` | Local backend port, default `3001` |
| `BLOB_READ_WRITE_TOKEN` | Optional public Vercel Blob token for image uploads |

Generate a signing secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Secrets belong only in the ignored backend environment file or hosting environment settings. The frontend does not need any secret.

```sh
npm run db:seed
npm run dev
```

Storefront: `http://localhost:5173/`. Admin: `http://localhost:5173/admin/`. API: `http://127.0.0.1:3001/api/health`.

The seed creates indexes and imports the original 12 products and nine family photos, preserving existing records. Seeded stock is **zero**; set actual units in admin before accepting orders. `frontend/src/products.js` is seed input only; the website reads MongoDB.

Provision the owner using `backend/scripts/set-admin.mjs` with `ADMIN_SETUP_EMAIL` and `ADMIN_SETUP_PASSWORD` set in the shell, then clear those variables. Sign in at `/admin/`. Public signups become customers; admins can manage their roles/access. The configured owner cannot be blocked/demoted through user management.

## Connected features

- Immediate customer signup/login without email verification by default; optional email verification, login/logout, forgot/reset password and profile editing.
- Signed HS256 JWTs in HttpOnly, SameSite cookies; Secure cookies in production. Signature, issuer, audience and expiry checks plus revocable database sessions. Logout, reset and blocking invalidate sessions. Tokens never enter browser localStorage.
- Guest cart persistence and account merging; wishlist additions require customer login. Signed-in cart/wishlist data is saved in MongoDB and visible to administrators in Customer carts / Customer wishlists and user details.
- Independent customer and administrator session cookies. Admin API/auth calls use the admin session scope; the storefront never renders an administrator as a shopping account.
- Customer account sections for orders, wishlist, saved addresses and profile details. Checkout can select a saved address or use a new one.
- PIN-based city/state suggestions via `/api/postal-codes/:pin`, backed by `https://api.postalpincode.in/pincode/{PIN}`. Lookups are validated, time-limited and cached; no customer name/address is sent to the provider. Postal district is used as the city suggestion and can be edited. Lookup outages allow manual entry and do not establish delivery serviceability.
- Product creation/editing/archiving, optional images, inventory, sizes, categories, search and filters.
- Server-priced COD checkout, shipping settings, coupons, idempotent orders, transactional stock checks and cancellation restocking.
- Customer order history, delivery tracking, cancellation and return requests. Admin order transitions, returns and manual COD payment/refund recording.
- Moderated customer reviews; verified-purchase badges require a delivered order. Admin sample reviews are labelled **Demo review** and excluded from rating averages.
- Published/draft banners, family gallery and blogs; changes appear on the storefront after refresh.
- Customer enquiries, real admin overview and user/role management.
- Optional JPEG/PNG/WebP uploads up to 3 MB to public Vercel Blob. Without a token, HTTPS/local image URLs and image-free records still work.

Writes use request validation, same-origin checks, a custom request header and database-backed rate limits. The API protects every admin route. Checkout ignores browser-supplied prices/totals. Blog content is plain text.

## Commands and tests

```sh
npm run server          # Express only
npm run build           # Storefront + admin -> frontend/dist
npm run check:services  # Database ping and SMTP authentication; no mail sent
npm test                # API tests with a temporary MongoDB replica set
npm run test:ui         # Browser tests; start npm run dev first
```

Tests capture email delivery and use isolated databases, without creating users/orders in Atlas or sending real emails. Browser tests use installed Chrome on Windows, `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, or Playwright Chromium. The first test run may download a MongoDB binary. `UI_BASE_URL` changes the frontend test URL; its origin must be allowed by test configuration.

## Vercel deployment

Import the repository with its root as Root Directory. Build: `npm run build`; output: `frontend/dist`. The root API adapter exports Express as a Vercel function. Set the backend environment variables in Vercel, including the final HTTPS `APP_URL`, `JWT_SECRET`, MongoDB and email credentials. Seed the deployment database before first use. MongoDB must allow connections from the deployment environment.

Create a **public** Vercel Blob store and add `BLOB_READ_WRITE_TOKEN` to enable uploads. Images are stored in Blob, not on the function filesystem. See [Vercel Blob documentation](https://vercel.com/docs/vercel-blob/using-blob-sdk). Storefront and API share an origin.

Signup currently does not require email delivery (`REQUIRE_EMAIL_VERIFICATION=false`). Accounts retain an accurate unverified email status while being allowed to sign in and shop. Password recovery still needs working email credentials; the previously supplied Gmail App Password was rejected with `EAUTH`. Configure email before enabling required verification again.

Checkout currently supports **Cash on Delivery**. Online payments, automatic courier booking and refund transfers require provider credentials and are not connected. Enter actual inventory and shipping/return policies in admin. Upload delivery cannot be live-tested until a Blob token is supplied.

Original product photography came from Odhni for the reference storefront; replace it with owned/licensed assets before commercial publication. Supplied brand/family photos remain in `frontend/public`.
