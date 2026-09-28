import { z } from "zod";
import { fail, rateLimit } from "../services/auth.service.js";

export const getProductsByIdReviews = async (req, res) => {
  const items = await req.models.reviews
    .find(
      { productId: Number(req.params.id), status: "published" },
      { projection: { userId: 0 } },
    )
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  const real = items.filter((r) => !r.isDemo);
  res.json({
    items,
    count: real.length,
    average: real.length
      ? real.reduce((sum, r) => sum + r.rating, 0) / real.length
      : 0,
  });
};

export const postProductsByIdReviews = async (req, res) => {
  await rateLimit(req.db, "reviews:" + req.user._id, 10, 3600);
  const input = z
    .object({
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(3).max(120),
      body: z.string().trim().min(10).max(2000),
    })
    .parse(req.body);
  const productId = Number(req.params.id);
  if (!(await req.models.products.findOne({ id: productId, status: "active" })))
    throw fail(404, "Product not found.");
  const purchase = await req.models.orders.findOne({
    userId: req.user._id,
    status: "delivered",
    "items.productId": productId,
  });
  await req.models.reviews.insertOne({
    ...input,
    productId,
    userId: req.user._id,
    name: req.user.name,
    verifiedPurchase: Boolean(purchase),
    isDemo: false,
    status: "pending",
    createdAt: new Date(),
  });
  res
    .status(201)
    .json({ message: "Thank you. Your review is awaiting moderation." });
};
