import { z } from "zod";
import { text, imageUrl, email } from "../validators/schemas.js";
export const productsModel = (db) => db.collection("products");
export const productsIndexes = [
  [{ id: 1 }, { unique: true }],
  [{ sku: 1 }, { unique: true }],
];

export const productSchema = z
  .object({
    name: text(160).min(3),
    sku: text(60).min(2),
    category: text(50).min(2),
    fabric: text(160).min(2),
    price: z.number().min(1).max(1000000),
    old: z.number().min(0).max(1000000).default(0),
    imageUrl,
    colour: text(40).default(""),
    color: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .default("#173b69"),
    description: text(6000).default(""),
    sizes: z
      .array(text(30).min(1))
      .max(12)
      .refine(values => new Set(values.map(v=>v.toLowerCase())).size === values.length, "Sizes must be unique.")
      .default([]),
    stock: z.number().int().min(0).max(100000),
    status: z.enum(["active", "draft", "archived"]).default("draft"),
    tag: text(30).default(""),
  })
  .refine(
    (v) => !v.old || v.old >= v.price,
    "Original price cannot be below the selling price.",
  )
  .refine(
    (v) => v.category !== "Kurta sets" || v.sizes.length > 0,
    "Select at least one size.",
  );
