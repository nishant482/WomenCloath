import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/wishlist.controller.js";
const router = Router();
router.put("/wishlist", authenticate, controller.putWishlist);
export default router;
