import { z } from "zod";
import { publicCache } from "../services/public-cache.js";

export const getContent = async (req, res) => {
  const filter = { status: "published" };
  if (req.query.kind)
    filter.kind = z.enum(["banner", "family", "blog"]).parse(req.query.kind);
  const items = await req.models.content
    .find(filter)
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(200)
    .toArray();
  publicCache(res);
  res.json({ items });
};
