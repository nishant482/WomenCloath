import { config } from "../config/env.js";
import { fail } from "../services/auth.service.js";
export function checkOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origins = new Set([new URL(config.appUrl).origin]);
  for (const value of config.allowedOrigins) origins.add(new URL(value).origin);
  if (!config.production) {
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:5173");
  }
  const origin = req.headers.origin;
  if (!origin || !origins.has(origin))
    return next(fail(403, "This request is not from the store."));
  if (req.headers["x-requested-with"] !== "RajoStore")
    return next(fail(403, "Invalid request."));
  next();
}
