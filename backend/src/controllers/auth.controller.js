import { z } from "zod";
import { config } from "../config/env.js";
import { email, password, phone } from "../validators/schemas.js";

import {
  fail,
  hash,
  tokenFrom,
  publicUser,
  passwordHash,
  passwordMatches,
  loginSession,
  rateLimit,
  createChallenge,
  consumeChallenge,
  sessionScope,
  sessionCookie,
} from "../services/auth.service.js";

export const postAuthSignup = async (req, res) => {
  const input = z
    .object({ name: z.string().trim().min(2).max(100), email, password, phone })
    .parse(req.body);
  await rateLimit(req.db, "mail:" + input.email, 3, 600);
  const exists = await req.models.users.findOne({ email: input.email });
  const phoneOwner = await req.models.users.findOne({ loginPhone: input.phone });
  if (phoneOwner && String(phoneOwner._id) !== String(exists?._id)) throw fail(409, "An account with this mobile number already exists. Please sign in.");
  if (!config.requireEmailVerification) {
    if (exists) throw fail(409, "An account with this email already exists. Please sign in using your password.");
    const user = {
      ...input,
      loginPhone: input.phone,
      password: await passwordHash(input.password),
      role: "customer",
      emailVerified: false,
      status: "active",
      cart: [], wishlist: [], addresses: [],
      createdAt: new Date(),
    };
    const inserted = await req.models.users.insertOne(user);
    user._id = inserted.insertedId;
    await loginSession(req.db, res, user);
    return res.status(201).json({ user: publicUser(user), message: "Your account is ready. Welcome to RAJO!" });
  }
  if (exists?.emailVerified)
    return res.status(202).json({
      message:
        "If this address is eligible, a verification code will arrive. You can also sign in or reset your password.",
    });
  if (!exists)
    await req.models.users.insertOne({
      ...input,
      loginPhone: input.phone,
      password: await passwordHash(input.password),
      role: "customer",
      emailVerified: false,
      status: "active",
      cart: [],
      wishlist: [],
      addresses: [],
      createdAt: new Date(),
    });
  const code = await createChallenge(req.db, input.email, "verify");
  try {
    await req.services.deliverCode(input.email, code, "verify");
  } catch {
    throw fail(503, "Email could not be sent. Please use Resend code shortly.");
  }
  res.status(202).json({
    message:
      "Check your email for a verification code. It expires in 10 minutes.",
  });
};

export const postAuthResend = async (req, res) => {
  const input = z.object({ email }).parse(req.body);
  await rateLimit(req.db, "mail:" + input.email, 3, 600);
  const user = await req.models.users.findOne({
    email: input.email,
    emailVerified: false,
    status: "active",
  });
  if (user) {
    const code = await createChallenge(req.db, input.email, "verify");
    try {
      await req.services.deliverCode(input.email, code, "verify");
    } catch {
      throw fail(503, "Email delivery failed. Try again shortly.");
    }
  }
  res.json({
    message: "If eligible, a new verification code has been sent.",
  });
};

export const postAuthVerify = async (req, res) => {
  const input = z
    .object({ email, code: z.string().regex(/^\d{6}$/), password })
    .parse(req.body);
  await consumeChallenge(req.db, input.email, "verify", input.code);
  const user = await req.models.users.findOneAndUpdate(
    { email: input.email, status: "active" },
    {
      $set: {
        password: await passwordHash(input.password),
        emailVerified: true,
        role: input.email === config.adminEmail ? "admin" : "customer",
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  if (!user) throw fail(400, "Unable to verify this account.");
  res.json({ message: "Email verified. You can now sign in." });
};

export const postAuthLogin = async (req, res) => {
  const input = z
    .object({ email: email.optional(), phone: phone.optional(), password: z.string().min(1).max(128) })
    .refine(v => v.email || v.phone, "Enter your mobile number.")
    .parse(req.body);
  const user = await req.models.users.findOne(input.phone ? { loginPhone: input.phone } : { email: input.email });
  const valid = await passwordMatches(input.password, user?.password);
  if (!user || !valid || user.status !== "active")
    throw fail(401, "Mobile number, email or password is incorrect.");
  if (config.requireEmailVerification && !user.emailVerified)
    throw fail(403, "Please verify your email before signing in.");
  const scope = sessionScope(req);
  if (scope === 'admin' && user.role !== 'admin') throw fail(403, "This account does not have administrator access.");
  if (scope === 'customer' && user.role === 'admin') throw fail(403, "Please use the admin sign-in page for this account. Use a customer account to shop.");
  await loginSession(req.db, res, user, scope);
  res.json({ user: publicUser(user) });
};

export const postAuthForgot = async (req, res) => {
  const input = z.object({ email }).parse(req.body);
  await rateLimit(req.db, "mail:" + input.email, 3, 600);
  const user = await req.models.users.findOne({
    email: input.email,
    ...(config.requireEmailVerification ? { emailVerified: true } : {}),
    status: "active",
  });
  if (user) {
    const code = await createChallenge(req.db, input.email, "reset");
    try {
      await req.services.deliverCode(input.email, code, "reset");
    } catch {
      throw fail(503, "Email delivery failed. Try again shortly.");
    }
  }
  res.json({ message: "If an account exists, a reset code has been sent." });
};

export const postAuthReset = async (req, res) => {
  const input = z
    .object({ email, code: z.string().regex(/^\d{6}$/), password })
    .parse(req.body);
  await consumeChallenge(req.db, input.email, "reset", input.code);
  const user = await req.models.users.findOneAndUpdate(
    { email: input.email, ...(config.requireEmailVerification ? { emailVerified: true } : {}), status: "active" },
    {
      $set: {
        password: await passwordHash(input.password),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  if (!user) throw fail(400, "Unable to reset this account.");
  await req.models.sessions.deleteMany({ userId: user._id });
  res.json({ message: "Password reset. Sign in with your new password." });
};

export const getAuthMe = (req, res) => res.json({ user: publicUser(req.user) });

export const postAuthLogout = async (req, res) => {
  await req.models.sessions.deleteOne({ _id: hash(tokenFrom(req)) });
  res.setHeader(
    "Set-Cookie",
    `${sessionCookie(sessionScope(req))}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${config.production ? "; Secure" : ""}`,
  );
  res.json({ ok: true });
};
