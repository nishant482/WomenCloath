import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({
  path: ["../../.env.local", "../../.env"].map((path) =>
    fileURLToPath(new URL(path, import.meta.url)),
  ),
  quiet: true,
});
export const config = {
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "",
  database: process.env.MONGODB_DB || "rajo_threads",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  adminEmail: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  production:
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
};
