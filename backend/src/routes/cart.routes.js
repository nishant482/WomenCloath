import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/cart.controller.js";
const router = Router();
router.get("/cart", authenticate, controller.getCart);
router.put("/cart", authenticate, controller.putCart);
export default router;
