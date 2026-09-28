import { productSchema } from "../models/products.model.js";
import { fail } from "../services/auth.service.js";

export const getAdminProducts = async (req, res) =>
  res.json({
    items: await req.models.products
      .find({ status: { $ne: "deleted" } })
      .sort({ id: -1 })
      .limit(1000)
      .toArray(),
  });

export const postAdminProducts = async (req, res) => {
  const data = productSchema.parse(req.body);
  const counter = await req.models.counters.findOneAndUpdate(
    { _id: "products" },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const product = {
    ...data,
    id: counter.value,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await req.models.products.insertOne(product);
  res.status(201).json(product);
};

export const putAdminProductsById = async (req, res) => {
  const data = productSchema.parse(req.body);
  const result = await req.models.products.updateOne(
    { id: Number(req.params.id), status: { $ne: "deleted" } },
    { $set: { ...data, updatedAt: new Date() } },
  );
  if (!result.matchedCount) throw fail(404, "Product not found.");
  res.json({ ok: true });
};

export const deleteAdminProductsById = async (req, res) => {
  const result = await req.models.products.updateOne(
    { id: Number(req.params.id) },
    { $set: { status: "deleted", deletedAt: new Date(), updatedAt: new Date() } },
  );
  if (!result.matchedCount) throw fail(404, "Product not found.");
  res.json({ ok: true });
};
