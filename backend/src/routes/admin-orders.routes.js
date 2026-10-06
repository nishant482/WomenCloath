import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-orders.controller.js";
const router = Router();
router.get("/admin/orders", controller.getAdminOrders);
router.patch("/admin/orders/:id", controller.patchAdminOrdersById);
router.delete('/admin/orders/:id', controller.deleteAdminOrderById);
export default router;
