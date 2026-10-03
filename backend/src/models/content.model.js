import { z } from "zod";
import { text, imageUrl, email } from "../validators/schemas.js";
export const contentModel = (db) => db.collection("content");
export const contentIndexes = [[{ slug: 1 }, { unique: true }]];

export const contentSchema = z.object({
  kind: z.enum(["banner", "family", "blog"]),
  title: text(160).min(2),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(160),
  body: text(20000).default(""),
  imageUrl,
  mobileImageUrl: imageUrl,
  secondaryImageUrl: imageUrl,
  eyebrow: text(80).default('THE RAJO EDIT'),
  buttonText: text(60).default('Shop now'),
  layout: z.enum(['split', 'full']).default('full'),
  alt: text(250).default(""),
  link: z
    .string()
    .max(250)
    .refine(
      (v) => !v || /^(?:#)?\/(?!\/)[a-zA-Z0-9/_?=&%-]*$/.test(v),
      "Use a store link such as /collections/all.",
    )
    .default(""),
  status: z.enum(["draft", "published"]).default("draft"),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});
