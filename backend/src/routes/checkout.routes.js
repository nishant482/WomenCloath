import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/checkout.controller.js";
const router = Router();
router.post("/checkout/quote", authenticate, controller.postCheckoutQuote);
export default router;
