import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
  randomInt,
} from "node:crypto";
import { promisify } from "node:util";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
const scrypt = promisify(scryptCallback);
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const fail = (status, message) =>
  Object.assign(new Error(message), { status });
export function objectId(value) {
  if (!ObjectId.isValid(value)) throw fail(400, "Invalid record ID.");
  return new ObjectId(value);
}
export async function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + (await scrypt(password, salt, 64)).toString("hex");
}
export async function passwordMatches(password, encoded) {
  const [salt, key] = (encoded || "").split(":");
  if (!salt || !key) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  emailVerified: Boolean(u.emailVerified),
  phone: u.phone || "",
  addresses: u.addresses || [],
});
export const sessionScope = req => req.headers['x-session-scope'] === 'admin' || req.originalUrl?.startsWith('/api/admin') ? 'admin' : 'customer';
export const sessionCookie = scope => scope === 'admin' ? 'rajo_admin_session' : 'rajo_session';
export function tokenFrom(req) {
  const name = sessionCookie(sessionScope(req));
  const cookies = req.headers.cookie
    ?.split(";")
    .map((x) => x.trim()) || [];
  const cookie = cookies.find(x => x.startsWith(name + '='));
  if (cookie) return cookie.slice(name.length + 1);
  // A customer session may reach an admin endpoint, where its role is rejected.
  return sessionScope(req) === 'admin' ? cookies.find(x => x.startsWith('rajo_session='))?.slice(13) || '' : '';
}
export async function loginSession(db, res, user, scope = 'customer') {
  if (config.jwtSecret.length < 32)
    throw fail(503, "Authentication is not configured.");
  const token = jwt.sign({}, config.jwtSecret, {
    algorithm: "HS256",
    subject: String(user._id),
    jwtid: randomBytes(32).toString("hex"),
    issuer: "rajo-api",
    audience: "rajo-store",
    expiresIn: "7d",
  });
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db
    .collection("sessions")
    .insertOne({ _id: hash(token), userId: user._id, expiresAt });
  res.setHeader(
    "Set-Cookie",
    `${sessionCookie(scope)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${config.production ? "; Secure" : ""}`,
  );
}

export async function rateLimit(db, key, limit, seconds) {
  const window = Math.floor(Date.now() / (seconds * 1000));
  const id = hash(key + ":" + window);
  const row = await db.collection("rateLimits").findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((window + 1) * seconds * 1000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (row.count > limit)
    throw fail(429, "Too many attempts. Please try again later.");
}
export async function createChallenge(db, email, purpose) {
  const code = String(randomInt(100000, 1000000));
  await db.collection("challenges").updateOne(
    { _id: hash(email + purpose) },
    {
      $set: {
        email,
        purpose,
        codeHash: hash(code),
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60000),
      },
    },
    { upsert: true },
  );
  return code;
}
export async function consumeChallenge(db, email, purpose, code) {
  const row = await db.collection("challenges").findOneAndUpdate(
    {
      _id: hash(email + purpose),
      expiresAt: { $gt: new Date() },
      attempts: { $lt: 5 },
    },
    { $inc: { attempts: 1 } },
    { returnDocument: "before" },
  );
  if (!row || row.codeHash !== hash(code))
    throw fail(400, "The code is invalid or expired. Request a new code.");
  const deleted = await db
    .collection("challenges")
    .deleteOne({ _id: row._id, codeHash: row.codeHash });
  if (!deleted.deletedCount)
    throw fail(400, "This code has already been used.");
}
