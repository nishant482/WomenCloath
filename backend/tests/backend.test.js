process.env.JWT_SECRET = "isolated-test-jwt-secret-at-least-32-characters";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import memoryUtils from "mongodb-memory-server-core/lib/util/utils.js";
import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
process.env.NODE_ENV = "test";
process.env.ADMIN_EMAIL = "owner@example.com";
process.env.REQUIRE_EMAIL_VERIFICATION = "true";
process.env.APP_URL = "http://localhost:5173";
delete process.env.VERCEL;
// Keep the upstream download checksum verification, but stream the large Windows archive.
memoryUtils.md5FromFile = async (file) => {
  const checksum = createHash("md5");
  for await (const chunk of createReadStream(file)) checksum.update(chunk);
  return checksum.digest("hex");
};
const { createApp } = await import("../src/app.js");
const { createIndexes } = await import("../src/config/database.js");
const { hash } = await import("../src/services/auth.service.js");
const { config } = await import("../src/config/env.js");
let repl, client, db, app, owner, customer, other;
const codes = new Map();
test("only successful public catalogue responses are edge-cacheable", async () => {
  for (const path of ["/api/products", "/api/content"]) {
    const response = await request(app).get(path).expect(200);
    assert.match(response.headers["vercel-cdn-cache-control"], /s-maxage=30/);
    assert.match(response.headers["cache-control"], /max-age=0/);
  }
  for (const path of ["/api/auth/me", "/api/cart", "/api/admin/users", "/api/products/999999"]) {
    const response = await request(app).get(path);
    assert.ok(response.status >= 400);
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal(response.headers["vercel-cdn-cache-control"], undefined);
  }
});
const pass = "A-test-password-123!";
const mutation = (agent, method, path, body) =>
  agent[method](path)
    .set("Origin", "http://localhost:5173")
    .set("X-Requested-With", "RajoStore")
    .send(body);
async function signup(agent, email) {
  await mutation(agent, "post", "/api/auth/signup", {
    name: email.split("@")[0],
    email,
    password: pass,
  }).expect(202);
  const code = codes.get(email + ":verify");
  await mutation(agent, "post", "/api/auth/verify", {
    email,
    code,
    password: pass,
  }).expect(200);
  const result = await mutation(agent, "post", "/api/auth/login", {
    email,
    password: pass,
  }).expect(200);
  return result.body.user;
}
async function product(stock = 10) {
  const p = {
    id: Math.floor(Math.random() * 1e7) + 100,
    name: "Test saree",
    sku: randomUUID(),
    category: "Sarees",
    fabric: "Cotton",
    price: 1000,
    old: 1200,
    imageUrl: "",
    stock,
    status: "active",
    sizes: [],
    color: "#173b69",
  };
  await db.collection("products").insertOne(p);
  return p;
}
const shipping = {
  name: "Test Customer",
  phone: "9876543210",
  line1: "12 Test Street",
  line2: "",
  city: "Jaipur",
  state: "Rajasthan",
  postalCode: "302001",
  country: "India",
};
before(async () => {
  repl = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "7.0.14" },
  });
  client = await new MongoClient(repl.getUri()).connect();
  db = client.db("rajo_integration");
  await createIndexes(db);
  app = createApp({
    getConnection: async () => ({ client, db }),
    deliverCode: async (email, code, purpose) =>
      codes.set(email + ":" + purpose, code),
  });
  owner = request.agent(app).set('X-Session-Scope', 'admin');
  customer = request.agent(app);
  other = request.agent(app);
  await signup(owner, "owner@example.com");
  await signup(customer, "customer@example.com");
  await signup(other, "other@example.com");
  await db.collection("settings").insertOne({
    _id: "store",
    shippingFee: 50,
    freeShippingAbove: 2999,
    codEnabled: true,
  });
});
after(async () => {
  await client?.close();
  await repl?.stop();
});
test("JWT signature, expiry and logout revocation are enforced", async () => {
  const agent = request.agent(app);
  const result = await mutation(agent, "post", "/api/auth/login", {
    email: "customer@example.com",
    password: pass,
  }).expect(200);
  const cookie = result.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/);
  const token = cookie.split(";")[0].slice(13);
  assert.equal(token.split(".").length, 3);
  const claims = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: "rajo-api",
    audience: "rajo-store",
  });
  assert.ok(claims.sub && claims.jti);
  const forged = jwt.sign(
    { sub: claims.sub, jti: claims.jti },
    "wrong-signing-secret-that-is-long-enough",
    { issuer: "rajo-api", audience: "rajo-store", expiresIn: "7d" },
  );
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "rajo_session=" + forged)
    .expect(401);
  const expired = jwt.sign(
    { sub: claims.sub, jti: claims.jti },
    process.env.JWT_SECRET,
    { issuer: "rajo-api", audience: "rajo-store", expiresIn: -1 },
  );
  // Insert a matching session to prove the JWT expiry check is independently enforced.
  await db
    .collection("sessions")
    .insertOne({
      _id: hash(expired),
      userId: (
        await db.collection("users").findOne({ email: "customer@example.com" })
      )._id,
      expiresAt: new Date(Date.now() + 60000),
    });
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "rajo_session=" + expired)
    .expect(401);
  await mutation(agent, "post", "/api/auth/logout").expect(200);
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "rajo_session=" + token)
    .expect(401);
});

test("invalid combined order updates roll back status and stock", async () => {
  const p = await product(2);
  await mutation(customer, "put", "/api/cart", {
    items: [{ productId: p.id, qty: 1 }],
  }).expect(200);
  const created = await mutation(customer, "post", "/api/orders", {
    address: shipping,
  })
    .set("Idempotency-Key", randomUUID())
    .expect(201);
  await mutation(owner, "patch", "/api/admin/orders/" + created.body._id, {
    status: "cancelled",
    paymentStatus: "paid",
  }).expect(400);
  const order = await db
    .collection("orders")
    .findOne({ number: created.body.number });
  assert.equal(order.status, "placed");
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    1,
  );
  await mutation(owner, "patch", "/api/admin/orders/" + created.body._id, {
    status: "cancelled",
  }).expect(200);
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    2,
  );
});
test("signup requires verification; password hashes and role are server controlled", async () => {
  const a = request.agent(app),
    email = "pending@example.com";
  await mutation(a, "post", "/api/auth/signup", {
    name: "Pending",
    email,
    password: pass,
    role: "admin",
    emailVerified: true,
  }).expect(202);
  await mutation(a, "post", "/api/auth/login", {
    email,
    password: pass,
  }).expect(403);
  const u = await db.collection("users").findOne({ email });
  assert.notEqual(u.password, pass);
  assert.equal(u.role, "customer");
  assert.equal(u.emailVerified, false);
  await mutation(a, "post", "/api/auth/verify", {
    email,
    code: "000000",
    password: pass,
  }).expect(400);
  await mutation(a, "post", "/api/auth/verify", {
    email,
    code: codes.get(email + ":verify"),
    password: pass,
  }).expect(200);
  await mutation(a, "post", "/api/auth/verify", {
    email,
    code: codes.get(email + ":verify"),
    password: pass,
  }).expect(400);
});
test("account and admin endpoints enforce sessions and roles", async () => {
  await request(app).get("/api/cart").expect(401);
  await customer.get("/api/admin/users").expect(403);
  const r = await owner.get("/api/admin/users").expect(200);
  assert.ok(r.body.items.every((u) => !u.password));
  await mutation(customer, "patch", "/api/account", {
    name: "Customer",
    role: "admin",
    addresses: [],
  }).expect(200);
  assert.equal((await customer.get("/api/auth/me")).body.user.role, "customer");
});

test("signup without verification skips email, starts a customer session and protects existing accounts", async () => {
  config.requireEmailVerification = false;
  let mailCalls = 0;
  const directApp = createApp({ getConnection: async () => ({ client, db }), deliverCode: async () => { mailCalls++; throw new Error('SMTP unavailable'); } });
  const agent = request.agent(directApp);
  const email = "direct-signup@example.com";
  try {
    const created = await mutation(agent, 'post', '/api/auth/signup', { name: 'Direct User', email, password: pass, role: 'admin', emailVerified: true }).expect(201);
    assert.equal(created.body.user.role, 'customer');
    assert.equal(created.body.user.emailVerified, false);
    assert.equal(mailCalls, 0);
    await agent.get('/api/auth/me').expect(200);
    await agent.get('/api/cart').expect(200);
    await agent.get('/api/admin/users').expect(403);
    await mutation(agent, 'post', '/api/auth/logout').expect(200);
    await mutation(agent, 'post', '/api/auth/signup', { name: 'Replacement', email, password: 'Different-password!' }).expect(409);
    await mutation(agent, 'post', '/api/auth/login', { email, password: pass }).expect(200);
    await mutation(agent, 'post', '/api/auth/login', { email: 'pending@example.com', password: pass }).expect(200);
    await mutation(agent, 'post', '/api/auth/signup', { name: 'Pretend Owner', email: 'owner@example.com', password: pass }).expect(409);
    assert.equal(mailCalls, 0);
  } finally { config.requireEmailVerification = true; }
});
test("cross-origin writes are rejected", async () => {
  await request(app)
    .post("/api/auth/login")
    .set("Origin", "https://untrusted.example")
    .set("X-Requested-With", "RajoStore")
    .send({ email: "owner@example.com", password: pass })
    .expect(403);
});

test('admin deletion hides products and users, revokes sessions and protects the owner', async () => {
  const p = await product();
  await mutation(customer, 'delete', '/api/admin/products/' + p.id).expect(403);
  await mutation(owner, 'delete', '/api/admin/products/' + p.id).expect(200);
  const catalogue = await owner.get('/api/admin/products').expect(200);
  assert.ok(!catalogue.body.items.some(row => row.id === p.id));
  assert.equal((await db.collection('products').findOne({ id: p.id })).status, 'deleted');
  await request(app).get('/api/products/' + p.id).expect(404);
  const agent = request.agent(app);
  const u = await signup(agent, 'delete-user@example.com');
  const ordersBefore = await db.collection('orders').countDocuments();
  await mutation(customer, 'delete', '/api/admin/users/' + u.id).expect(403);
  await mutation(owner, 'delete', '/api/admin/users/' + u.id).expect(200);
  await agent.get('/api/auth/me').expect(401);
  await mutation(agent, 'post', '/api/auth/login', { email: u.email, password: pass }).expect(401);
  const users = await owner.get('/api/admin/users').expect(200);
  assert.ok(!users.body.items.some(row => String(row._id) === u.id));
  assert.equal(await db.collection('orders').countDocuments(), ordersBefore);
  const admin = (await owner.get('/api/auth/me')).body.user;
  await mutation(owner, 'delete', '/api/admin/users/' + admin.id).expect(400);
});

test('dashboard charts use real order totals and provide 30 days of data', async () => {
  const response = await owner.get('/api/admin/overview').expect(200);
  assert.equal(response.body.dailySales.length, 30);
  assert.equal(response.body.orderStatuses.reduce((sum, row) => sum + row.count, 0), await db.collection('orders').countDocuments());
  assert.ok(response.body.dailySales.every(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.orders >= 0 && row.revenue >= 0));
});

test('admin and customer sessions remain independent in the same browser', async () => {
  const both = request.agent(app);
  await mutation(both, 'post', '/api/auth/login', { email: 'owner@example.com', password: pass }).expect(403);
  const admin = await mutation(both, 'post', '/api/auth/login', { email: 'owner@example.com', password: pass }).set('X-Session-Scope', 'admin').expect(200);
  assert.match(admin.headers['set-cookie'][0], /^rajo_admin_session=/);
  await both.get('/api/auth/me').expect(401);
  await mutation(both, 'post', '/api/auth/login', { email: 'customer@example.com', password: pass }).expect(200);
  assert.equal((await both.get('/api/auth/me')).body.user.email, 'customer@example.com');
  assert.equal((await both.get('/api/auth/me').set('X-Session-Scope', 'admin')).body.user.email, 'owner@example.com');
  await mutation(both, 'post', '/api/auth/logout').set('X-Session-Scope', 'admin').expect(200);
  await both.get('/api/auth/me').expect(200);
  await both.get('/api/admin/users').expect(401);
});

test('wishlist requires login and admins can read customer cart/wishlist details', async () => {
  await mutation(request(app), 'put', '/api/wishlist', { items: [] }).expect(401);
  const p = await product();
  await mutation(customer, 'put', '/api/cart', { items: [{ productId: p.id, qty: 2 }] }).expect(200);
  await mutation(customer, 'put', '/api/wishlist', { items: [p.id] }).expect(200);
  const user = (await customer.get('/api/auth/me')).body.user;
  await customer.get('/api/admin/users/' + user.id + '/shopping').expect(403);
  const details = await owner.get('/api/admin/users/' + user.id + '/shopping').expect(200);
  assert.equal(details.body.cart[0].qty, 2);
  assert.equal(details.body.cart[0].lineTotal, p.price * 2);
  assert.equal(details.body.wishlist[0].id, p.id);
  const list = await owner.get('/api/admin/users').expect(200);
  const row = list.body.items.find(u => String(u._id) === user.id);
  assert.equal(row.cartCount, 2); assert.equal(row.wishlistCount, 1); assert.equal(row.password, undefined);
});
test("public catalog filters drafts and product inputs are validated", async () => {
  const a = await product();
  await db
    .collection("products")
    .updateOne({ id: a.id }, { $set: { status: "draft" } });
  await request(app)
    .get("/api/products/" + a.id)
    .expect(404);
  await mutation(owner, "post", "/api/admin/products", {
    name: "Bad",
    price: -1,
  }).expect(400);
  const good = {
    name: "Admin saree",
    sku: randomUUID(),
    category: "Sarees",
    fabric: "Silk",
    price: 900,
    old: 0,
    stock: 5,
    status: "active",
    imageUrl: "",
  };
  const r = await mutation(owner, "post", "/api/admin/products", good).expect(
    201,
  );
  assert.equal(r.body.imageUrl, "");
  await mutation(owner, "delete", "/api/admin/products/" + r.body.id).expect(
    200,
  );
  await request(app)
    .get("/api/products/" + r.body.id)
    .expect(404);
});
test("cart and wishlist persist per user; client prices are ignored", async () => {
  const p = await product();
  await mutation(customer, "put", "/api/cart", {
    items: [{ productId: p.id, qty: 2, price: 1 }],
  }).expect(200);
  const r = await customer.get("/api/cart").expect(200);
  assert.equal(r.body.items[0].qty, 2);
  assert.equal((await other.get("/api/cart")).body.items.length, 0);
  await mutation(customer, "put", "/api/wishlist", { items: [p.id] }).expect(
    200,
  );
  assert.deepEqual((await customer.get("/api/cart")).body.wishlist, [p.id]);
  const quote = await mutation(
    customer,
    "post",
    "/api/checkout/quote",
    {},
  ).expect(200);
  assert.equal(quote.body.total, 2050);
});
test("checkout is idempotent and cancellation restores stock exactly once", async () => {
  const p = await product(5);
  await mutation(customer, "put", "/api/cart", {
    items: [{ productId: p.id, qty: 2 }],
  }).expect(200);
  const key = randomUUID();
  const submit = () =>
    customer
      .post("/api/orders")
      .set("Origin", "http://localhost:5173")
      .set("X-Requested-With", "RajoStore")
      .set("Idempotency-Key", key)
      .send({ address: shipping, total: 1 });
  const first = await submit().expect(201);
  const second = await submit().expect(201);
  assert.equal(first.body._id, second.body._id);
  assert.equal(first.body.total, 2050);
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    3,
  );
  await mutation(
    other,
    "post",
    "/api/orders/" + first.body._id + "/cancel",
  ).expect(404);
  await mutation(
    customer,
    "post",
    "/api/orders/" + first.body._id + "/cancel",
  ).expect(200);
  await mutation(
    customer,
    "post",
    "/api/orders/" + first.body._id + "/cancel",
  ).expect(200);
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    5,
  );
});
test("concurrent checkouts cannot oversell the last unit", async () => {
  const p = await product(1);
  for (const a of [customer, other])
    await mutation(a, "put", "/api/cart", {
      items: [{ productId: p.id, qty: 1 }],
    }).expect(200);
  const result = await Promise.all(
    [customer, other].map((a) =>
      a
        .post("/api/orders")
        .set("Origin", "http://localhost:5173")
        .set("X-Requested-With", "RajoStore")
        .set("Idempotency-Key", randomUUID())
        .send({ address: shipping }),
    ),
  );
  assert.deepEqual(result.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    0,
  );
});
test("coupons and COD setting are enforced server-side", async () => {
  const p = await product(8);
  await mutation(customer, "put", "/api/cart", {
    items: [{ productId: p.id, qty: 1 }],
  }).expect(200);
  await mutation(owner, "post", "/api/admin/coupons", {
    code: "SAVE10",
    type: "percentage",
    value: 10,
    minimum: 500,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    active: true,
  }).expect(201);
  const quote = await mutation(customer, "post", "/api/checkout/quote", {
    coupon: "SAVE10",
  }).expect(200);
  assert.equal(quote.body.total, 950);
  await db
    .collection("settings")
    .updateOne({ _id: "store" }, { $set: { codEnabled: false } });
  await customer
    .post("/api/orders")
    .set("Origin", "http://localhost:5173")
    .set("X-Requested-With", "RajoStore")
    .set("Idempotency-Key", randomUUID())
    .send({ address: shipping })
    .expect(400);
  await db
    .collection("settings")
    .updateOne({ _id: "store" }, { $set: { codEnabled: true } });
});
test("real reviews require login and moderation; demo reviews are labelled and excluded from averages", async () => {
  const p = await product();
  await mutation(request(app), "post", "/api/products/" + p.id + "/reviews", {
    rating: 5,
    title: "Lovely",
    body: "Beautiful fabric and finish.",
  }).expect(401);
  await mutation(customer, "post", "/api/products/" + p.id + "/reviews", {
    rating: 4,
    title: "Lovely",
    body: "Beautiful fabric and finish.",
    verifiedPurchase: true,
    isDemo: false,
  }).expect(201);
  let list = (await request(app).get("/api/products/" + p.id + "/reviews"))
    .body;
  assert.equal(list.items.length, 0);
  const review = await db.collection("reviews").findOne({ productId: p.id });
  assert.equal(review.verifiedPurchase, false);
  await mutation(owner, "patch", "/api/admin/reviews/" + review._id, {
    status: "published",
  }).expect(200);
  await mutation(owner, "post", "/api/admin/reviews", {
    productId: p.id,
    rating: 5,
    title: "Sample review",
    body: "Sample content for layout testing.",
    status: "published",
    isDemo: false,
  }).expect(201);
  list = (await request(app).get("/api/products/" + p.id + "/reviews")).body;
  assert.equal(list.items.length, 2);
  assert.equal(list.count, 1);
  assert.equal(list.average, 4);
  assert.equal(list.items.filter((r) => r.isDemo).length, 1);
  await mutation(customer, "post", "/api/products/" + p.id + "/reviews", {
    rating: 5,
    title: "Duplicate",
    body: "A duplicate review is rejected.",
  }).expect(409);
});
test("content publication controls storefront visibility and image is optional", async () => {
  const record = await mutation(owner, "post", "/api/admin/content", {
    kind: "blog",
    title: "A story",
    slug: "a-story",
    body: "The story begins here.",
    status: "draft",
  }).expect(201);
  assert.equal(
    (await request(app).get("/api/content?kind=blog")).body.items.length,
    0,
  );
  await mutation(owner, "put", "/api/admin/content/" + record.body._id, {
    kind: "blog",
    title: "A story",
    slug: "a-story",
    body: "The story begins here.",
    status: "published",
  }).expect(200);
  assert.equal(
    (await request(app).get("/api/content?kind=blog")).body.items.length,
    1,
  );
  await mutation(customer, "post", "/api/admin/content", {
    kind: "blog",
  }).expect(403);
});
test("reset password revokes old sessions; verification code cannot be reused", async () => {
  const a = request.agent(app);
  await signup(a, "reset@example.com");
  await mutation(a, "post", "/api/auth/forgot", {
    email: "reset@example.com",
  }).expect(200);
  const code = codes.get("reset@example.com:reset");
  await mutation(a, "post", "/api/auth/reset", {
    email: "reset@example.com",
    code,
    password: "A-new-password-123!",
  }).expect(200);
  await a.get("/api/auth/me").expect(401);
  await mutation(a, "post", "/api/auth/reset", {
    email: "reset@example.com",
    code,
    password: pass,
  }).expect(400);
});
test("blocked users lose access and owner cannot be demoted", async () => {
  const a = request.agent(app);
  const u = await signup(a, "blocked@example.com");
  await mutation(owner, "patch", "/api/admin/users/" + u.id, {
    role: "customer",
    status: "blocked",
  }).expect(200);
  await a.get("/api/auth/me").expect(401);
  const me = (await owner.get("/api/auth/me")).body.user;
  await mutation(owner, "patch", "/api/admin/users/" + me.id, {
    role: "customer",
    status: "blocked",
  }).expect(400);
});
test("enquiries reach admin and optional uploads fail clearly without a token", async () => {
  await mutation(request(app), "post", "/api/enquiries", {
    name: "Customer",
    email: "enquiry@example.com",
    subject: "Sizing",
    message: "Can you help with the sizing?",
  }).expect(201);
  assert.equal((await owner.get("/api/admin/enquiries")).body.items.length, 1);
  await mutation(customer, "post", "/api/admin/uploads", {}).expect(403);
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    await mutation(owner, "post", "/api/admin/uploads", {}).expect(503);
});
test("verification codes lock after five failures", async () => {
  const a = request.agent(app);
  const email = "locked@example.com";
  await mutation(a, "post", "/api/auth/signup", {
    name: "Locked",
    email,
    password: pass,
  }).expect(202);
  for (let i = 0; i < 5; i++)
    await mutation(a, "post", "/api/auth/verify", {
      email,
      code: "000000",
      password: pass,
    }).expect(400);
  await mutation(a, "post", "/api/auth/verify", {
    email,
    code: codes.get(email + ":verify"),
    password: pass,
  }).expect(400);
});
