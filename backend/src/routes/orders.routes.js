import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/orders.controller.js";
const router = Router();
router.post("/orders", authenticate, controller.postOrders);
router.get("/orders", authenticate, controller.getOrders);
router.post(
  "/orders/:id/cancel",
  authenticate,
  controller.postOrdersByIdCancel,
);
router.post(
  "/orders/:id/return",
  authenticate,
  controller.postOrdersByIdReturn,
);
export default router;
