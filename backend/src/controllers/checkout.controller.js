import { z } from "zod";
import { priceCart } from "../services/order.service.js";

export const postCheckoutQuote = async (req, res) => {
  const { coupon } = z
    .object({ coupon: z.string().trim().toUpperCase().max(30).default("") })
    .parse(req.body);
  res.json(await priceCart(req.db, req.user.cart, coupon));
};
