process.env.JWT_SECRET = "isolated-test-jwt-secret-at-least-32-characters";
import assert from "node:assert/strict";
import { existsSync, createReadStream, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import memoryUtils from "mongodb-memory-server-core/lib/util/utils.js";
import { MongoClient } from "mongodb";
process.env.NODE_ENV = "test";
process.env.ADMIN_EMAIL = "studio@example.com";
process.env.REQUIRE_EMAIL_VERIFICATION = "false";
process.env.APP_URL = "http://localhost:5173";
delete process.env.VERCEL;
memoryUtils.md5FromFile = async (file) => {
  const hash = createHash("md5");
  for await (const c of createReadStream(file)) hash.update(c);
  return hash.digest("hex");
};
const { createApp } = await import("../src/app.js");
const { passwordHash } = await import("../src/services/auth.service.js");
const { createIndexes } = await import("../src/config/database.js");
const { products } = await import("../../frontend/src/products.js");
const { defaultSettings } = await import("../src/models/settings.model.js");
let repl, client, server, browser;
const codes = new Map();
const errors = [];
const base = process.env.UI_BASE_URL || "http://localhost:5173";
try {
  repl = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "7.0.14" },
  });
  client = await new MongoClient(repl.getUri()).connect();
  const db = client.db("rajo_ui");
  await createIndexes(db);
  await db.collection('users').insertOne({ name: 'Studio Admin', email: 'studio@example.com', password: await passwordHash('Strong-test-password!'), role: 'admin', emailVerified: true, status: 'active', cart: [], wishlist: [], addresses: [], createdAt: new Date() });
  await db.collection("products").insertMany(
    products.map((p) => ({
      ...p,
      sku: "UI-" + p.id,
      imageUrl: "/images/" + p.image + ".jpg",
      sizes: p.category === "Kurta sets" ? ["S", "M", "L"] : [],
      stock: 10,
      status: "active",
    })),
  );
  await db.collection("counters").insertOne({ _id: "products", value: 12 });
  await db
    .collection("settings")
    .insertOne({ _id: "store", ...defaultSettings });
  const app = createApp({
    getConnection: async () => ({ db, client }),
    postalLookup: async pin => {
      if (pin === '999999') throw Object.assign(new Error('PIN lookup is unavailable. Please enter your city and state manually.'), { status: 503 });
      return { postalCode: pin, city: 'Jaipur', state: 'Rajasthan', locations: [{ city: 'Jaipur', state: 'Rajasthan' }] };
    },
    deliverCode: async (email, code, purpose) =>
      codes.set(email + purpose, code),
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const target = "http://127.0.0.1:" + server.address().port;
  const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : existsSync(chrome)
        ? { executablePath: chrome }
        : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  console.log("Browser: guest shopping");
  page.on("pageerror", (e) => errors.push(e.message));
  // Every API call is routed to the isolated real backend; no live customer database writes.
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: target + url.pathname + url.search,
    });
    await route.fulfill({ response });
  });
  async function go(hash = "/") {
    await page.goto(base + "/#" + hash);
    await page.locator("header.store-header").waitFor();
  }
  async function register(email) {
    await page
      .getByRole("button", { name: "Create an account", exact: true })
      .click();
    await page.getByLabel("Full name", { exact: true }).fill("UI Shopper");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("Strong-test-password!");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.locator('.account-page').waitFor();
    assert.equal(codes.size, 0, 'Signup must not send email');
  }
  await go("/product/6");
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Added to your bag" })
    .waitFor();
  await page.getByRole("button", { name: "Save this product" }).click();
  await page.getByRole('heading', { name: 'Welcome back.', exact: true }).waitFor();
  assert.match(page.url(), /account/);
  assert.equal(await page.locator('.auth-visual').count(), 0);
  await go("/account");
  console.log("Browser: customer signup and checkout");
  await register("shopper@example.com");
  await page.getByRole("heading", { name: "Hello, UI Shopper." }).waitFor();
  await page.getByRole('button', { name: 'Profile details', exact: true }).click();
  await page.getByLabel('Mobile number', { exact: true }).fill('9876543210');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Profile updated.' }).waitFor();
  await page.getByRole('button', { name: 'Saved addresses', exact: true }).click();
  await page.getByRole('button', { name: 'Add address', exact: true }).click();
  await page.getByLabel('PIN code', { exact: true }).fill('302001');
  await page.waitForFunction(() => document.querySelector('input[name="city"]')?.value === 'Jaipur');
  await page.getByLabel('Address', { exact: true }).fill('42 Test Street');
  await page.getByRole('button', { name: 'Save address', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Address saved.' }).waitFor();
  assert.equal((await db.collection('users').findOne({ email: 'shopper@example.com' })).wishlist.length, 0);
  await go('/product/6');
  await page.getByRole('button', { name: 'Save this product', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('button[aria-label="Save this product"]')?.getAttribute('aria-pressed') === 'true');
  await go('/account');
  await page.getByRole('button', { name: /My wishlist/ }).click();
  assert.equal(await page.locator('.customer-wishlist article').count(), 1);
  await page
    .getByRole("button", { name: "Open shopping bag", exact: true })
    .click();
  assert.equal(await page.locator(".bag-item").count(), 1);
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await page.getByRole("heading", { name: "Delivery details" }).waitFor();
  await page.getByLabel('Saved address', { exact: true }).selectOption('-1');
  await page.getByLabel('PIN code', { exact: true }).fill('999999');
  await page.getByRole('status').filter({ hasText: 'enter your city and state manually' }).waitFor();
  await page.getByLabel('City', { exact: true }).fill('Manual city');
  assert.equal(await page.getByLabel('City', { exact: true }).inputValue(), 'Manual city');
  for (const [label, value] of [
    ["Full name", "UI Shopper"],
    ["Mobile number", "9876543210"],
    ["Address", "42 Test Street"],
    ["PIN code", "302001"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.waitForFunction(() => document.querySelector('input[name="city"]')?.value === 'Jaipur');
  assert.equal(await page.getByLabel('State', { exact: true }).inputValue(), 'Rajasthan');
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await page.locator(".checkout-success").waitFor();
  console.log("Browser: order and review");
  assert.equal(await db.collection("orders").countDocuments(), 1);
  assert.equal((await db.collection("products").findOne({ id: 6 })).stock, 9);
  await page.getByRole("link", { name: "View your orders" }).click();
  await page.locator(".customer-order").waitFor();
  mkdirSync('.tools/screenshots', { recursive: true });
  await page.locator('.customer-hub').screenshot({ path: '.tools/screenshots/customer-account.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Customer account mobile overflow');
  await page.locator('.customer-hub').screenshot({ path: '.tools/screenshots/customer-account-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/product/6");
  await page.getByText("Write a review", { exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Beautiful fit");
  await page
    .getByLabel("Your experience")
    .fill("A comfortable fabric and a lovely fit.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "awaiting moderation" })
    .waitFor();
  await go('/product/1');
  await page.getByRole('button', { name: 'Add to bag', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Added to your bag' }).waitFor();
  await go("/account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
  await page.goto(base + "/admin/");
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), `Admin login scroll at ${viewport.width}x${viewport.height}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel('Email address', { exact: true }).fill('studio@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Strong-test-password!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  console.log("Browser: admin content");
  await page.locator(".studio").waitFor();
  await page.locator('.studio-sidebar a[href="#carts"]').click();
  await page.getByRole('button', { name: 'View UI Shopper', exact: true }).click();
  await page.locator('.admin-customer-shopping .shopping-product').first().waitFor();
  assert.match(await page.locator('.admin-customer-shopping').innerText(), /Emerald Swirl Tunic Set/);
  assert.match(await page.locator('.admin-customer-shopping').innerText(), /Sunehri Yellow Embroidered Saree/);
  await page.getByRole('button', { name: 'Close details', exact: true }).click();
  await page.locator('.studio-sidebar a[href="#wishlists"]').click();
  await page.getByRole('button', { name: 'View UI Shopper', exact: true }).waitFor();
  await page
    .locator(".studio-sidebar")
    .getByRole("link", { name: "Blog posts", exact: true })
    .click();
  await page.getByRole("button", { name: "Add new", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("The art of the drape");
  await page.getByLabel("URL slug").fill("the-art-of-the-drape");
  await page
    .getByLabel("Text / article content")
    .fill("A beautiful story published from the connected admin studio.");
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.locator("dialog").waitFor({ state: "detached" });
  assert.equal(
    await db
      .collection("content")
      .countDocuments({ kind: "blog", status: "published" }),
    1,
  );
  await page
    .locator(".studio-sidebar")
    .getByRole("link", { name: "RAJO family", exact: true })
    .click();
  await page.getByRole("button", { name: "Add new", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Together at RAJO");
  await page.getByLabel("URL slug").fill("together-at-rajo");
  await page.getByLabel("Image URL").fill("/images/pinki-yadav.jpeg");
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.locator("dialog").waitFor({ state: "detached" });
  await page
    .locator(".studio-sidebar")
    .getByRole("link", { name: "Reviews", exact: true })
    .click();
  await page
    .getByLabel("Review status: Beautiful fit")
    .selectOption("published");
  await page.getByRole("status").filter({ hasText: "Changes saved" }).waitFor();
  await page
    .locator(".studio-sidebar")
    .getByRole("link", { name: "Products & inventory", exact: true })
    .click();
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  for (const [label, value] of [
    ["Product name", "UI linen saree"],
    ["SKU", "UI-NEW"],
    ["Fabric & finish", "Linen"],
    ["Selling price (₹)", "1499"],
    ["Available units", "12"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel("Status", { exact: true }).selectOption("active");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.locator("dialog").waitFor({ state: "detached" });
  assert.equal(
    await db.collection("products").countDocuments({ name: "UI linen saree" }),
    1,
  );
  console.log('Browser: classic dashboard, pagination, product views, deletion and tab switching');
  assert.equal(await page.locator('.studio-table-wrap tbody tr').count(), 10);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  assert.equal(await page.locator('.studio-table-wrap tbody tr').count(), 3);
  await page.getByRole('button', { name: 'Previous page', exact: true }).click();
  await page.getByRole('button', { name: 'View UI linen saree', exact: true }).click();
  await page.getByRole('dialog', { name: 'UI linen saree', exact: true }).waitFor();
  assert.match(await page.locator('.product-detail-layout').innerText(), /UI-NEW/);
  await page.getByRole('button', { name: 'Close details', exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page.locator('.studio-sidebar a[href="#orders"]').click();
    await page.locator('.studio-table-wrap tbody tr').first().waitFor();
    assert.match(await page.locator('.studio-table-wrap').innerText(), /UI Shopper/);
    await page.locator('.studio-sidebar a[href="#users"]').click();
    await page.locator('.studio-sidebar a[href="#products"]').click();
    await page.getByRole('button', { name: 'View UI linen saree', exact: true }).waitFor();
  }
  for (const tab of ['returns', 'reports', 'coupons', 'settings']) {
    assert.equal(await page.locator(`.studio-sidebar a[href="#${tab}"]`).count(), 0);
  }
  for (const tab of ['inventory', 'categories', 'payments']) {
    await page.locator(`.studio-sidebar a[href="#${tab}"]`).click();
    await page.locator('.table-pagination').waitFor();
    assert.equal(await page.locator('.commerce-error').count(), 0);
  }
  await page.locator('.studio-sidebar nav a[href="#overview"]').click();
  await page.getByLabel('Chart period').selectOption('30');
  await page.getByLabel('Chart metric').selectOption('orders');
  assert.match(await page.locator('.sales-chart').getAttribute('aria-label'), /30 days/);
  const disposable = { ...products[0], id: 999, sku: 'UI-DELETE', name: 'Delete test product', sizes: [], imageUrl: '', status: 'draft', stock: 1, createdAt: new Date() };
  await db.collection('products').insertOne(disposable);
  await page.locator('.studio-sidebar a[href="#products"]').click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete Delete test product', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Delete test product', exact: true }).waitFor({ state: 'detached' });
  assert.equal((await db.collection('products').findOne({ id: 999 })).status, 'deleted');
  const extraUser = await db.collection('users').insertOne({ name: 'Delete test user', email: 'delete-ui@example.com', role: 'customer', status: 'active', createdAt: new Date() });
  await page.locator('.studio-sidebar a[href="#users"]').click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete Delete test user', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Delete test user', exact: true }).waitFor({ state: 'detached' });
  assert.equal((await db.collection('users').findOne({ _id: extraUser.insertedId })).status, 'deleted');
  await go("/blog/the-art-of-the-drape");
  await page
    .getByRole("heading", { name: "The art of the drape", exact: true })
    .waitFor();
  await go('/account');
  await page.getByRole('heading', { name: 'Welcome back.', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Open admin', exact: true }).count(), 0);
  await go("/rajo-family");
  assert.equal(await page.locator(".customer-photo").count(), 1);
  await go("/collections/all");
  assert.equal(await page.locator(".product").count(), 13);
  await go("/product/6");
  await page.waitForFunction(() => document.querySelectorAll('.review-card').length === 1);
  assert.equal(await page.locator(".review-card").count(), 1);
  const overflow = [];
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/account",
      "/checkout",
      "/blog",
      "/rajo-family",
      "/collections/all",
    ]) {
      await go(route);
      await page.waitForTimeout(100);
      const size = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      if (size > width + 1) overflow.push({ route, width, size });
    }
  }
  assert.deepEqual(overflow, []);
  assert.deepEqual(errors, []);
  mkdirSync(".tools/screenshots", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/admin/#overview");
  await page.locator(".sales-chart").waitFor();
  await page.screenshot({ path: ".tools/screenshots/backend-admin.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/admin/#products");
  await page.locator(".table-pagination").waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await page.screenshot({
    path: ".tools/screenshots/backend-admin-mobile.png",
  });
  console.log(
    "PASS: signup without email + admin login, guest cart merge, wishlist, COD checkout, review submission/moderation, admin blog/family/product creation, 24 responsive route checks, desktop/mobile admin.",
  );
} catch (error) {
  console.error("Browser test failure:", error.message);
  throw error;
} finally {
  await browser?.close();
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  await client?.close();
  await repl?.stop();
}
