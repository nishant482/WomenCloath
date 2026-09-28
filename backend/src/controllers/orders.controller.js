import { z } from "zod";
import { fail, rateLimit, objectId } from "../services/auth.service.js";
import {
  checkoutSchema,
  createOrder,
  transitionOrder,
} from "../services/order.service.js";

export const postOrders = async (req, res) => {
  await rateLimit(req.db, "orders:" + req.user._id, 15, 3600);
  const order = await createOrder(
    req.mongo,
    req.db,
    req.user,
    checkoutSchema.parse(req.body),
    req.headers["idempotency-key"],
  );
  res.status(201).json(order);
};

export const getOrders = async (req, res) =>
  res.json({
    items: await req.models.orders
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
  });

export const postOrdersByIdCancel = async (req, res) =>
  res.json(
    await transitionOrder(
      req.mongo,
      req.db,
      req.params.id,
      "cancelled",
      req.user,
    ),
  );

export const postOrdersByIdReturn = async (req, res) => {
  const { reason } = z
    .object({ reason: z.string().trim().min(10).max(1000) })
    .parse(req.body);
  const order = await req.models.orders.findOne({
    _id: objectId(req.params.id),
    userId: req.user._id,
    status: "delivered",
  });
  if (!order)
    throw fail(400, "Only delivered orders can have a return request.");
  await req.models.orders.updateOne(
    { _id: order._id, returnRequest: { $exists: false } },
    {
      $set: {
        returnRequest: {
          reason,
          status: "requested",
          createdAt: new Date(),
        },
      },
    },
  );
  res.json({ ok: true });
};
