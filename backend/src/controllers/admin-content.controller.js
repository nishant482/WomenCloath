import { contentSchema } from "../models/content.model.js";
import { fail, objectId } from "../services/auth.service.js";

export const getAdminContent = async (req, res) =>
  res.json({
    items: await req.models.content
      .find(req.adminContentKinds ? {kind: {$in: req.adminContentKinds}} : {})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray(),
  });

export const postAdminContent = async (req, res) => {
  const data = contentSchema.parse(req.body);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
  const row = { ...data, createdAt: new Date(), updatedAt: new Date() };
  await req.models.content.insertOne(row);
  res.status(201).json(row);
};

export const putAdminContentById = async (req, res) => {
  const data = contentSchema.parse(req.body);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
  const result = await req.models.content.updateOne(
    { _id: objectId(req.params.id) },
    { $set: { ...data, updatedAt: new Date() } },
  );
  if (!result.matchedCount) throw fail(404, "Record not found.");
  res.json({ ok: true });
};

export const deleteAdminContentById = async (req, res) => {
  await req.models.content.deleteOne({ _id: objectId(req.params.id) });
  res.json({ ok: true });
};
