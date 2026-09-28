import { z } from "zod";

export const getContent = async (req, res) => {
  const filter = { status: "published" };
  if (req.query.kind)
    filter.kind = z.enum(["banner", "family", "blog"]).parse(req.query.kind);
  res.json({
    items: await req.models.content
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(200)
      .toArray(),
  });
};
