import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-products.controller.js";
const router = Router();
router.get("/admin/products", controller.getAdminProducts);
router.post("/admin/products", controller.postAdminProducts);
router.put("/admin/products/:id", controller.putAdminProductsById);
router.delete("/admin/products/:id", controller.deleteAdminProductsById);
export default router;
