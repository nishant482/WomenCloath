import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-coupons.controller.js";
const router = Router();
router.get("/admin/coupons", controller.getAdminCoupons);
router.post("/admin/coupons", controller.postAdminCoupons);
router.put("/admin/coupons/:id", controller.putAdminCouponsById);
router.delete("/admin/coupons/:id", controller.deleteAdminCouponsById);
export default router;
