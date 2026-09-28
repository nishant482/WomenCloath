import { fail } from "../services/auth.service.js";

export const getProducts = async (req, res) => {
  const page = Math.max(1, Math.min(1000, Number(req.query.page) || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 100));
  const filter = { status: "active" };
  if (req.query.category)
    filter.category = String(req.query.category).slice(0, 50);
  if (req.query.q)
    filter.name = {
      $regex: String(req.query.q)
        .slice(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  const items = await req.models.products
    .find(filter, { projection: { _id: 0 } })
    .sort({ id: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  res.json({
    items,
    total: await req.models.products.countDocuments(filter),
    page,
  });
};

export const getProductsById = async (req, res) => {
  const p = await req.models.products.findOne(
    { id: Number(req.params.id), status: "active" },
    { projection: { _id: 0 } },
  );
  if (!p) throw fail(404, "Product not found.");
  res.json(p);
};
