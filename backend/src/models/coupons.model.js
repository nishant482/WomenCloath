import { z } from "zod";
import { text, imageUrl, email } from "../validators/schemas.js";
export const couponsModel = (db) => db.collection("coupons");
export const couponsIndexes = [[{ code: 1 }, { unique: true }]];

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{3,30}$/),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().positive().max(100000),
    minimum: z.number().min(0).default(0),
    expiresAt: z.string().datetime(),
    active: z.boolean(),
  })
  .refine(
    (c) => c.type !== "percentage" || c.value <= 100,
    "Percentage must be at most 100.",
  );
