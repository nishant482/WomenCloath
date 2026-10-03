import { z } from "zod";
import { address, phone } from "../validators/schemas.js";

import { publicUser } from "../services/auth.service.js";

export const patchAccount = async (req, res) => {
  const data = z
    .object({
      name: z.string().trim().min(2).max(100),
      phone,
      emailUpdates: z.boolean().optional(),
      addresses: z.array(address).max(5).default([]),
    })
    .parse(req.body);
  const user = await req.models.users.findOneAndUpdate(
    { _id: req.user._id },
    { $set: { ...data, loginPhone: data.phone, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  res.json({ user: publicUser(user) });
};
