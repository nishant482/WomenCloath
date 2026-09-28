import { z } from "zod";
import { objectId } from "../services/auth.service.js";

export const getAdminEnquiries = async (req, res) =>
  res.json({
    items: await req.models.enquiries
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray(),
  });

export const patchAdminEnquiriesById = async (req, res) => {
  const { status } = z
    .object({ status: z.enum(["new", "resolved"]) })
    .parse(req.body);
  await req.models.enquiries.updateOne(
    { _id: objectId(req.params.id) },
    { $set: { status } },
  );
  res.json({ ok: true });
};
