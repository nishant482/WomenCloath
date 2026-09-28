import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-reviews.controller.js";
const router = Router();
router.get("/admin/reviews", controller.getAdminReviews);
router.post("/admin/reviews", controller.postAdminReviews);
router.patch("/admin/reviews/:id", controller.patchAdminReviewsById);
router.delete("/admin/reviews/:id", controller.deleteAdminReviewsById);
export default router;
