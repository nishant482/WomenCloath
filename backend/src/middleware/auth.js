import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { fail, hash, tokenFrom, sessionScope } from "../services/auth.service.js";
export async function authenticate(req, res, next) {
  try {
    const token = tokenFrom(req);
    if (!token) throw fail(401, "Please sign in to continue.");
    let claims;
    try {
      claims = jwt.verify(token, config.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "rajo-api",
        audience: "rajo-store",
      });
      if (!claims.sub || !claims.jti) throw new Error("Invalid claims");
    } catch {
      throw fail(401, "Your session has expired. Please sign in again.");
    }
    const session =
      token &&
      (await req.db
        .collection("sessions")
        .findOne({ _id: hash(token), expiresAt: { $gt: new Date() } }));
    const user =
      session &&
      String(session.userId) === claims.sub &&
      (await req.db.collection("users").findOne({
        _id: session.userId,
        status: "active",
        ...(config.requireEmailVerification ? { emailVerified: true } : {}),
      }));
    if (!user) throw fail(401, "Please sign in to continue.");
    if (sessionScope(req) === 'customer' && user.role === 'admin') throw fail(401, "Please sign in with a customer account.");
    if (sessionScope(req) === 'admin' && user.role !== 'admin') throw fail(403, "Administrator access is required.");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
export const requireAdmin = (req, res, next) =>
  req.user.role === "admin"
    ? next()
    : next(fail(403, "Administrator access is required."));
