import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/reviews.controller.js";
const router = Router();
router.get("/products/:id/reviews", controller.getProductsByIdReviews);
router.post(
  "/products/:id/reviews",
  authenticate,
  controller.postProductsByIdReviews,
);
export default router;
