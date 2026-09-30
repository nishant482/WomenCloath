import { z } from "zod";
import { text, imageUrl, email } from "../validators/schemas.js";
export const settingsModel = (db) => db.collection("settings");
export const settingsIndexes = [];

export const settingsSchema = z.object({
  storeName: text(100).min(2),
  shippingFee: z.number().min(0).max(10000),
  freeShippingAbove: z.number().min(0).max(1000000),
  codEnabled: z.boolean(),
  contactEmail: z.union([email, z.literal("")]),
  shippingPolicy: text(6000),
  returnPolicy: text(6000),
});
export const defaultSettings = {
  storeName: "RAJO Threads",
  shippingFee: 0,
  freeShippingAbove: 2999,
  codEnabled: true,
  contactEmail: "Info.rajothreads@gmail.com",
  shippingPolicy: "Delivery timelines will be confirmed with your order.",
  returnPolicy:
    "Contact the store about return eligibility before placing an order.",
};
