import { z } from "zod";
import { transitionOrder } from "../services/order.service.js";

export const getAdminOrders = async (req, res) =>
  res.json({
    items: await req.models.orders
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray(),
  });

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
