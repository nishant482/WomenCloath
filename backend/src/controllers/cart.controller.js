import { z } from "zod";
import { fail } from "../services/auth.service.js";
import { cartResponse } from "../services/cart.service.js";

export const getCart = async (req, res) => res.json(await cartResponse(req));

export const putCart = async (req, res) => {
  const { items } = z
    .object({
      items: z
        .array(
          z.object({
            productId: z.number().int().positive(),
            size: z.string().max(30).default(""),
            qty: z.number().int().min(1).max(20),
          }),
        )
        .max(50),
    })
    .parse(req.body);
  const seen = new Set();
  for (const item of items) {
    const p = await req.models.products.findOne({
      id: item.productId,
      status: "active",
    });
    if (!p) throw fail(400, "A product is unavailable.");
    if (p.sizes?.length > 0 && !p.sizes.includes(item.size))
      throw fail(400, "Choose an available size.");
    if (!p.sizes?.length) item.size = "";
    const key = item.productId + "-" + item.size;
    if (seen.has(key)) throw fail(400, "Duplicate bag items.");
    seen.add(key);
  }
  await req.models.users.updateOne(
    { _id: req.user._id },
    { $set: { cart: items, updatedAt: new Date() } },
  );
  res.json(await cartResponse(req));
};
