import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/checkout.controller.js";
const router = Router();
router.post('/checkout/guest/quote', controller.postGuestQuote);
router.post('/checkout/guest/orders', controller.postGuestOrder);
router.post("/checkout/quote", authenticate, controller.postCheckoutQuote);
export default router;
