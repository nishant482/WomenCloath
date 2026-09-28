# RAJO Studio

Open `/admin/` with the frontend and backend running. Sign in using the configured administrator account. For initial setup or an administrator credential change, set `ADMIN_SETUP_EMAIL` and `ADMIN_SETUP_PASSWORD` in the shell and run `node backend/scripts/set-admin.mjs` from the project root. Clear these variables afterwards. The script hashes the password, revokes that account's existing sessions, and updates `ADMIN_EMAIL` in the ignored backend environment file; credentials are never embedded in the frontend. Restart the backend after changing its environment configuration. Email signup and verification are also available using `ADMIN_EMAIL`.

The studio connects to protected `/api/admin/*` routes for products/inventory, orders/returns, users/roles, review moderation, banners, family photos, blogs, coupons, enquiries and store/shipping settings. `main.jsx` is the entry; `styles.css` contains responsive styles.

Images are optional. HTTPS/local URLs work immediately; file uploads require the server's `BLOB_READ_WRITE_TOKEN`. Admin-created reviews are labelled demo reviews. COD collection/refund controls record manually completed actions; they do not transfer money.

Customer signup currently works without verification email (`REQUIRE_EMAIL_VERIFICATION=false`): it creates a customer account and signs them in immediately. Existing unverified customers can sign in with their original password. Public signup never grants administrator access. Password recovery still requires configured email delivery. Set `REQUIRE_EMAIL_VERIFICATION=true` only when verification emails are configured and required again.

The classic white/logo-red admin workspace includes Overview, Reports, Products, Inventory, Categories, Orders, Returns, Payments, Users, Reviews, Banners, Family, Blog posts, Discount codes, Enquiries and Store settings. Reports use actual paid order totals and order counts for the last 7 or 30 days in India time. Categories summarise the three supported catalogue categories; they are not a free-form category editor.

Customer carts and Customer wishlists list signed-in customers with saved items. The View action shows product names, images, quantities, sizes, current prices and availability. Guest carts remain local until customer login. Administrator sessions use a separate cookie from customer sessions, so logging into the admin panel does not sign the administrator into the public shopping account.

Record tables support search, status filters, sorting, CSV export and 10 records per page within the API's existing list limits (1,000 products; 500 for most other resources). View opens product information or order/customer details. Product and user deletion removes the record from admin lists and public access using a deleted status; historical order data remains intact. User deletion revokes sessions. The current administrator and configured owner cannot be deleted. Content, coupon and review deletion uses the existing delete endpoints. Payments and refunds record externally completed actions.

See the [repository guide](../../README.md) for setup, seed, test and deployment commands.
