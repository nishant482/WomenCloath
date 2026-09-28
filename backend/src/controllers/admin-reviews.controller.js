import { z } from "zod";
import { fail, objectId } from "../services/auth.service.js";

export const getAdminReviews = async (req, res) =>
  res.json({
    items: await req.models.reviews
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray(),
  });

export const postAdminReviews = async (req, res) => {
  const data = z
    .object({
      productId: z.number().int().positive(),
      rating: z.number().int().min(1).max(5),
      title: z.string().trim().min(3).max(120),
      body: z.string().trim().min(10).max(2000),
      status: z.enum(["draft", "published"]).default("draft"),
    })
    .parse(req.body);
  if (!(await req.models.products.findOne({ id: data.productId })))
    throw fail(404, "Product not found.");
  const record = {
    ...data,
    name: "Demo customer",
    isDemo: true,
    verifiedPurchase: false,
    createdAt: new Date(),
  };
  await req.models.reviews.insertOne(record);
  res.status(201).json(record);
};

export const patchAdminReviewsById = async (req, res) => {
  const { status } = z
    .object({ status: z.enum(["published", "rejected", "pending", "draft"]) })
    .parse(req.body);
  await req.models.reviews.updateOne(
    { _id: objectId(req.params.id) },
    { $set: { status } },
  );
  res.json({ ok: true });
};

export const deleteAdminReviewsById = async (req, res) => {
  await req.models.reviews.deleteOne({ _id: objectId(req.params.id) });
  res.json({ ok: true });
};
