import express from "express";
import razorpayRoutes from './routes/razorpay.routes.js';
import seoRoutes from './routes/seo.routes.js';
import categoriesRoutes from "./routes/categories.routes.js";
import { requireAdminAccess } from "./middleware/admin-access.js";
import { lookupPostalCode } from './services/postal.service.js';
import { connect } from "./config/database.js";
import { sendCode } from "./services/email.service.js";
import { fail } from "./services/auth.service.js";
import { authenticate, requireAdmin } from "./middleware/auth.js";
import { authLimit } from "./middleware/auth-limit.js";
import { errorHandler } from "./middleware/error-handler.js";
import { checkOrigin } from "./middleware/request-security.js";
import { createModels } from "./models/index.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import accountRoutes from "./routes/account.routes.js";
import productsRoutes from "./routes/products.routes.js";
import contentRoutes from "./routes/content.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import enquiriesRoutes from "./routes/enquiries.routes.js";
import adminOverviewRoutes from "./routes/admin-overview.routes.js";
import adminUsersRoutes from "./routes/admin-users.routes.js";
import adminOrdersRoutes from "./routes/admin-orders.routes.js";
import adminProductsRoutes from "./routes/admin-products.routes.js";
import adminReviewsRoutes from "./routes/admin-reviews.routes.js";
import adminContentRoutes from "./routes/admin-content.routes.js";
import adminCouponsRoutes from "./routes/admin-coupons.routes.js";
import adminSettingsRoutes from "./routes/admin-settings.routes.js";
import adminEnquiriesRoutes from "./routes/admin-enquiries.routes.js";
import adminUploadsRoutes from "./routes/admin-uploads.routes.js";
import productEmailRoutes from './routes/product-email.routes.js';
export function createApp({
  getConnection = connect,
  deliverCode = sendCode,
  postalLookup = lookupPostalCode,
  razorpayRequest,
} = {}) {
  const app = express();
  // Vercel forwards the original public URL to the rewritten function.
  app.use((req, res, next) => {
    if (req.path === '/sitemap.xml') req.url = '/api' + req.url;
    next();
  });
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    });
    next();
  });
  app.use(checkOrigin);
  app.use(
    "/api/admin/uploads",
    express.raw({
      type: ["image/jpeg", "image/png", "image/webp"],
      limit: "3mb",
    }),
  );
  app.use(express.json({ limit: "128kb" }));
  app.get('/api/postal-codes/:pin', async (req, res) => {
    if (!/^[1-9]\d{5}$/.test(req.params.pin)) throw fail(400, 'Enter a valid six-digit PIN code.');
    res.json(await postalLookup(req.params.pin));
  });
  app.use("/api", async (req, res, next) => {
    try {
      const connection = await getConnection();
      req.db = connection.db;
      req.mongo = connection.client;
      req.models = createModels(req.db);
      req.services = { deliverCode, razorpayRequest };
      next();
    } catch {
      next(
        fail(
          503,
          "The store database is unavailable. Please try again shortly.",
        ),
      );
    }
  });

  app.use("/api/auth", authLimit);

  app.use("/api/admin", authenticate, requireAdmin, requireAdminAccess);

  app.use("/api", healthRoutes);
  app.use('/api', seoRoutes);
  app.use("/api", authRoutes);
  app.use("/api", accountRoutes);
  app.use("/api", productsRoutes);
  app.use("/api", categoriesRoutes);
  app.use("/api", contentRoutes);
  app.use("/api", settingsRoutes);
  app.use("/api", cartRoutes);
  app.use("/api", wishlistRoutes);
  app.use("/api", checkoutRoutes);
  app.use('/api',razorpayRoutes);
  app.use("/api", ordersRoutes);
  app.use("/api", reviewsRoutes);
  app.use("/api", enquiriesRoutes);
  app.use("/api", adminOverviewRoutes);
  app.use("/api", adminUsersRoutes);
  app.use("/api", adminOrdersRoutes);
  app.use("/api", adminProductsRoutes);
  app.use("/api", adminReviewsRoutes);
  app.use("/api", adminContentRoutes);
  app.use("/api", adminCouponsRoutes);
  app.use("/api", adminSettingsRoutes);
  app.use("/api", adminEnquiriesRoutes);
  app.use("/api", adminUploadsRoutes);
  app.use('/api',productEmailRoutes);
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use(errorHandler);
  return app;
}
export default createApp();
