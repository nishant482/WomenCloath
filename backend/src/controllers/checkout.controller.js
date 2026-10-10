import { z } from "zod";
import {paymentOptions} from '../services/razorpay-config.service.js';
import { priceCart } from "../services/order.service.js";
import { checkoutSchema, createOrder } from "../services/order.service.js";
import { fail, hash, rateLimit } from "../services/auth.service.js";
import { email } from "../validators/schemas.js";

const guestSchema = checkoutSchema.extend({ items: checkoutSchema.shape.items.unwrap(), email: email.optional() });
export const postGuestQuote = async (req, res) => {
  await rateLimit(req.db, "guest-quote:" + req.ip, 120, 600);
  const input = guestSchema.pick({ items: true, coupon: true }).parse(req.body);
  res.json({...await priceCart(req.db, input.items, input.coupon),...await paymentOptions(req.db)});
};
export const postGuestOrder = async (req, res) => {
  const input = guestSchema.parse(req.body);
  const key = req.headers['idempotency-key'];
  if (!/^[a-zA-Z0-9_-]{32,80}$/.test(key || '')) throw fail(400, 'A checkout request identifier is required.');
  await rateLimit(req.db, 'guest-orders-ip:' + req.ip, 20, 3600);
  await rateLimit(req.db, 'guest-orders-phone:' + input.address.phone, 5, 3600);
  const guest = { _id: 'guest:' + hash(key), guest: true, email: input.email || '', name: input.address.name, cart: input.items };
  res.status(201).json(await createOrder(req.mongo, req.db, guest, input, key));
};

export const postCheckoutQuote = async (req, res) => {
  const { coupon, items } = z
    .object({ coupon: z.string().trim().toUpperCase().max(30).default(""), items: checkoutSchema.shape.items })
    .parse(req.body);
  res.json({...await priceCart(req.db, items || req.user.cart, coupon),...await paymentOptions(req.db)});
};
