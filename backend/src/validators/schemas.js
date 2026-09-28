import { z } from "zod";
export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128);
export const text = (max = 300) => z.string().trim().max(max);
export const imageUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) =>
      !v ||
      /^\/images\/[\w .()%/-]+$/.test(v) ||
      /^\/customer\/[\w .()%/-]+$/.test(v) ||
      /^https:\/\/[^\s]+$/i.test(v),
    "Use an HTTPS image URL or a local image path.",
  )
  .default("");
export const address = z.object({
  name: text(100).min(2),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  line1: text(200).min(5),
  line2: text(200).default(""),
  city: text(80).min(2),
  state: text(80).min(2),
  postalCode: z.string().regex(/^\d{6}$/, "Enter a six-digit PIN code."),
  country: z.literal("India").default("India"),
});
