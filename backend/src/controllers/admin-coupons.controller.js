import { couponSchema } from "../models/coupons.model.js";
import { fail, objectId } from "../services/auth.service.js";

export const getAdminCoupons = async (req, res) =>
  res.json({
    items: await req.models.coupons
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray(),
  });

export const postAdminCoupons = async (req, res) => {
  const data = couponSchema.parse(req.body);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
  const row = { ...data, createdAt: new Date(), updatedAt: new Date() };
  await req.models.coupons.insertOne(row);
  res.status(201).json(row);
};

export const putAdminCouponsById = async (req, res) => {
  const data = couponSchema.parse(req.body);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
  const result = await req.models.coupons.updateOne(
    { _id: objectId(req.params.id) },
    { $set: { ...data, updatedAt: new Date() } },
  );
  if (!result.matchedCount) throw fail(404, "Record not found.");
  res.json({ ok: true });
};

export const deleteAdminCouponsById = async (req, res) => {
  await req.models.coupons.deleteOne({ _id: objectId(req.params.id) });
  res.json({ ok: true });
};
