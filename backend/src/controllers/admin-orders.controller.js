import { z } from "zod";
import { transitionOrder } from "../services/order.service.js";
import { fail, objectId } from '../services/auth.service.js';

export const getAdminOrders = async (req, res) =>
  res.json({
    items: await req.models.orders
      .find({ deletedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray(),
  });

export const deleteAdminOrderById = async (req, res) => {
  const id = objectId(req.params.id);
  const result = await req.models.orders.updateOne(
    { _id: id, deletedAt: { $exists: false } },
    { $set: { deletedAt: new Date(), deletedBy: String(req.user._id) } },
  );
  if (!result.matchedCount && !(await req.models.orders.findOne({ _id: id }, { projection: { _id: 1 } })))
    throw fail(404, 'Order not found.');
  res.json({ ok: true });
};

export const patchAdminOrdersById = async (req, res) => {
  const input = z
    .object({
      status: z
        .enum([
          "placed",
          "confirmed",
          "packed",
          "shipped",
          "delivered",
          "cancelled",
          "returned",
        ])
        .optional(),
      paymentStatus: z.enum(["paid", "refunded"]).optional(),
      trackingNumber: z.string().trim().max(100).optional(),
      courier: z.string().trim().max(100).optional(),
      returnStatus: z.enum(["approved", "rejected", "received"]).optional(),
    })
    .parse(req.body);
  await transitionOrder(
    req.mongo,
    req.db,
    req.params.id,
    input.status,
    req.user,
    input,
  );
  res.json({ ok: true });
};
