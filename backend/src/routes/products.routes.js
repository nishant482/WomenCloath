import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/products.controller.js";
const router = Router();
router.get("/products", controller.getProducts);
router.get("/products/:id", controller.getProductsById);
export default router;
