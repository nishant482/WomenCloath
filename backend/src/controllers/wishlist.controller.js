import { z } from "zod";

export const putWishlist = async (req, res) => {
  const { items } = z
    .object({ items: z.array(z.number().int().positive()).max(200) })
    .parse(req.body);
  const ids = await req.models.products
    .find(
      { id: { $in: [...new Set(items)] }, status: "active" },
      { projection: { id: 1 } },
    )
    .toArray();
  await req.models.users.updateOne(
    { _id: req.user._id },
    { $set: { wishlist: ids.map((p) => p.id), updatedAt: new Date() } },
  );
  res.json({ items: ids.map((p) => p.id) });
};
