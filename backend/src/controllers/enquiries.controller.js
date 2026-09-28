import { z } from "zod";
import { email } from "../validators/schemas.js";

import { rateLimit } from "../services/auth.service.js";

export const postEnquiries = async (req, res) => {
  await rateLimit(
    req.db,
    "enquiry:" + (req.socket.remoteAddress || "unknown"),
    5,
    3600,
  );
  const data = z
    .object({
      name: z.string().trim().min(2).max(100),
      email,
      subject: z.string().trim().min(2).max(100),
      message: z.string().trim().min(10).max(4000),
    })
    .parse(req.body);
  await req.models.enquiries.insertOne({
    ...data,
    status: "new",
    createdAt: new Date(),
  });
  res.status(201).json({
    message:
      "Your message has been received. The RAJO team will get back to you.",
  });
};
