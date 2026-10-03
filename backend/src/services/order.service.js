import { randomUUID } from "node:crypto";
import { config } from "../config/env.js";
import { z } from "zod";
import { address } from "../validators/schemas.js";
import { defaultSettings } from "../models/settings.model.js";
import { fail, objectId } from "../services/auth.service.js";
export const checkoutSchema = z.object({
  address,
  coupon: z.string().trim().toUpperCase().max(30).default(""),
  items: z.array(z.object({ productId: z.number().int().positive(), size: z.string().max(10).default(""), qty: z.number().int().min(1).max(20) })).min(1).max(50).optional(),
});
const cents = (n) => Math.round(n * 100);
export async function priceCart(db, cart, couponCode = "", session) {
  if (!cart?.length) throw fail(400, "Your bag is empty.");
  const settings = {
    ...defaultSettings,
    ...(await db.collection("settings").findOne({ _id: "store" }, { session })),
  };
  const items = [];
  const quantities = new Map();
  for (const line of cart) {
    const p = await db
      .collection("products")
      .findOne({ id: line.productId, status: "active" }, { session });
    if (!p) throw fail(409, "A product in your bag is no longer available.");
    if (p.category === "Kurta sets" && !p.sizes.includes(line.size))
      throw fail(400, "Choose an available size.");
    quantities.set(p.id, (quantities.get(p.id) || 0) + line.qty);
    if (p.stock < quantities.get(p.id))
      throw fail(409, `${p.name}: only ${p.stock} available.`);
    items.push({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      imageUrl: p.imageUrl,
      size: line.size || "",
      qty: line.qty,
      unitPrice: p.price,
      lineTotal: (cents(p.price) * line.qty) / 100,
    });
  }
  const subtotal = items.reduce((n, p) => n + cents(p.lineTotal), 0);
  let discount = 0,
    coupon = "";
  if (couponCode) {
    const c = await db
      .collection("coupons")
      .findOne(
        { code: couponCode, active: true, expiresAt: { $gt: new Date() } },
        { session },
      );
    if (!c || subtotal < cents(c.minimum))
      throw fail(
        400,
        "This discount code is invalid, expired, or below its minimum order.",
      );
    discount = Math.min(
      subtotal,
      c.type === "percentage"
        ? Math.round((subtotal * c.value) / 100)
        : cents(c.value),
    );
    coupon = c.code;
  }
  const shipping =
    settings.shippingMode === "free" || (settings.shippingMode === "threshold" && subtotal >= cents(settings.freeShippingAbove))
      ? 0
      : cents(settings.shippingFee);
  const codFee = settings.codEnabled ? cents(settings.codFee) : 0;
  return {
    items,
    subtotal: subtotal / 100,
    discount: discount / 100,
    shipping: shipping / 100,
    codFee: codFee / 100,
    total: (subtotal - discount + shipping + codFee) / 100,
    coupon,
    codEnabled: settings.codEnabled,
    currency: "INR",
  };
}
export async function createOrder(client, db, user, payload, idempotencyKey) {
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(idempotencyKey || ""))
    throw fail(400, "A checkout request identifier is required.");
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const existing = await db
        .collection("orders")
        .findOne({ userId: user._id, idempotencyKey }, { session });
      if (existing) return existing;
      const fresh = user.guest ? user : await db
        .collection("users")
        .findOne(
          { _id: user._id, status: "active", ...(config.requireEmailVerification ? { emailVerified: true } : {}) },
          { session },
        );
      if (!fresh) throw fail(401, "Please sign in again.");
      const cart = payload.items || fresh.cart || [];
      const quote = await priceCart(db, cart, payload.coupon, session);
      if (!quote.codEnabled)
        throw fail(
          400,
          "Checkout is not available at the moment. Please contact the store.",
        );
      for (const item of quote.items) {
        const result = await db
          .collection("products")
          .updateOne(
            { id: item.productId, status: "active", stock: { $gte: item.qty } },
            { $inc: { stock: -item.qty }, $set: { updatedAt: new Date() } },
            { session },
          );
        if (result.modifiedCount !== 1)
          throw fail(409, "Stock changed. Please refresh your bag.");
      }
      const order = {
        number: "RAJO-" + randomUUID().slice(0, 8).toUpperCase(),
        userId: user._id,
        email: user.email,
        customer: user.name,
        guest: Boolean(user.guest),
        ...quote,
        address: payload.address,
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        status: "placed",
        idempotencyKey,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [{ status: "placed", at: new Date() }],
      };
      delete order.codEnabled;
      const result = await db
        .collection("orders")
        .insertOne(order, { session });
      if (!user.guest && !payload.items) await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { cart: [], updatedAt: new Date() } },
          { session },
        );
      return { ...order, _id: result.insertedId };
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await db
        .collection("orders")
        .findOne({ userId: user._id, idempotencyKey });
      if (existing) return existing;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
const transitions = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
export async function transitionOrder(
  client,
  db,
  id,
  requestedStatus,
  actor,
  updates = {},
) {
  if (requestedStatus && !transitions[requestedStatus])
    throw fail(400, "Invalid order status.");
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const filter = {
        _id: objectId(id),
        ...(actor.role === "admin" ? {} : { userId: actor._id }),
      };
      const order = await db.collection("orders").findOne(filter, { session });
      if (!order) throw fail(404, "Order not found.");
      const status = requestedStatus || order.status;
      const changed = order.status !== status;
      if (!changed && Object.keys(updates).length === 0) return order;
      if (
        actor.role !== "admin" &&
        (status !== "cancelled" ||
          !["placed", "confirmed"].includes(order.status))
      )
        throw fail(400, "This order can no longer be cancelled online.");
      if (changed && !transitions[order.status]?.includes(status))
        throw fail(
          409,
          `Cannot move an order from ${order.status} to ${status}.`,
        );
      if (
        updates.paymentStatus === "paid" &&
        !["shipped", "delivered"].includes(status)
      )
        throw fail(
          400,
          "Record COD collection only for shipped or delivered orders.",
        );
      const nextPayment =
        changed && ["cancelled", "returned"].includes(status)
          ? order.paymentStatus === "paid"
            ? "refund_pending"
            : "void"
          : order.paymentStatus;
      if (
        updates.paymentStatus === "refunded" &&
        nextPayment !== "refund_pending"
      )
        throw fail(400, "No refund is pending.");
      if (updates.returnStatus && !order.returnRequest)
        throw fail(400, "No return has been requested.");
      if (changed && ["cancelled", "returned"].includes(status))
        for (const line of order.items)
          await db
            .collection("products")
            .updateOne(
              { id: line.productId },
              { $inc: { stock: line.qty } },
              { session },
            );
      const changes = {
        status,
        paymentStatus: updates.paymentStatus || nextPayment,
        updatedAt: new Date(),
      };
      for (const key of ["trackingNumber", "courier"])
        if (updates[key] !== undefined) changes[key] = updates[key];
      if (updates.returnStatus)
        changes["returnRequest.status"] = updates.returnStatus;
      return db.collection("orders").findOneAndUpdate(
        filter,
        {
          $set: changes,
          ...(changed
            ? {
                $push: {
                  history: { status, at: new Date(), by: String(actor._id) },
                },
              }
            : {}),
        },
        { session, returnDocument: "after" },
      );
    });
  } finally {
    await session.endSession();
  }
}
